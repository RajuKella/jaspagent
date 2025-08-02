// DocumentPage.tsx
import React, { useState, useEffect } from 'react';
import Header from './Header'; 
import Button from '../components/Button';
import { useAppSelector, useAppDispatch } from '../app/hook';
import {
    selectIsAuthenticated,
    selectAuthToken
} from '../features/auth/authSlice';
import {
    fetchDocumentsThunk,
    deleteDocumentThunk,
    uploadDocumentThunk,
    selectDocuments,
    selectDocumentsStatus,
    selectDocumentsError,
    selectUserProfile,
    selectUserStatus
} from '../features/user/userSlice';

// Import the direct API call for document status
import { fetchDocumentStatus } from '../services/documents';

// --- Constants ---
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
const MAX_TOTAL_SIZE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB (1024 MB)

// --- Interfaces ---
interface Document {
    id: number;
    name: string;
    // status?: string; // We'll manage status locally now
}

interface UploadStatus {
    status: 'uploading' | 'succeeded' | 'failed';
    error?: string;
}

// New interface for local document status
interface LocalDocStatus {
    status: string | null;
    error: string | null;
    loading: boolean;
}

const DocumentPage: React.FC = () => {
    const dispatch = useAppDispatch();

    // --- State ---
    const [view, setView] = useState<'list' | 'upload'>('list');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [deletingDocIds, setDeletingDocIds] = useState<Set<number>>(new Set());
    
    // Local state for document status (instead of Redux for status)
    const [localDocumentStatus, setLocalDocumentStatus] = useState<Record<number, LocalDocStatus>>({});
    
    // File Upload State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, UploadStatus>>({});
    
    // --- Redux Selectors ---
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const authToken = useAppSelector(selectAuthToken);
    const userProfile = useAppSelector(selectUserProfile);
    const userStatus = useAppSelector(selectUserStatus);
    const documents: Document[] = useAppSelector(selectDocuments) || [];
    const documentsStatus = useAppSelector(selectDocumentsStatus);
    const documentsError = useAppSelector(selectDocumentsError);

    const userId = userProfile?.id;
    const totalDocsUploaded = documents?.length || 0;
    const uploadLimit = userProfile?.total_documents_allowed || 10;

    // --- Effects ---
    useEffect(() => {
        if (isAuthenticated && authToken && userId && userStatus === 'succeeded' && documentsStatus === 'idle') {
            dispatch(fetchDocumentsThunk({userId }));
        }
    }, [isAuthenticated, authToken, userId, documentsStatus, userStatus, dispatch]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000); // 5 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // --- Handlers ---

    const isValidFileType = (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'text/csv',
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];
        return allowedTypes.includes(file.type);
    };

    const handleFileProcessing = (files: FileList) => {
        const newFiles = Array.from(files);
        let currentTotalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
        const filesToAdd: File[] = [];
        const errors: string[] = [];

        for (const file of newFiles) {
            if (!isValidFileType(file)) {
                errors.push(`Invalid type: ${file.name}. Only PDF, DOCX, CSV, & Excel are allowed.`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                errors.push(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 500MB.`);
                continue;
            }
            if (currentTotalSize + file.size > MAX_TOTAL_SIZE_BYTES) {
                errors.push(`Total size limit exceeded. Cannot add ${file.name}. Max total is 1GB.`);
                break; 
            }
            // Prevent adding duplicate files
            if (!selectedFiles.some(existingFile => existingFile.name === file.name)) {
                 filesToAdd.push(file);
                 currentTotalSize += file.size;
            }
        }

        if (errors.length > 0) {
            alert(errors.join('\n'));
        }
        
        if (filesToAdd.length > 0) {
            setSelectedFiles(prev => [...prev, ...filesToAdd]);
            setSuccessMessage(null);
            setUploadProgress({}); // Clear old progress on new selection
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleFileProcessing(event.target.files);
        }
        event.target.value = ''; // Allow re-selecting the same file(s)
    };

    const removeFile = (fileName: string) => {
        setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOver(false);
        if (event.dataTransfer.files) {
            handleFileProcessing(event.dataTransfer.files);
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles.length || !authToken || !userId) return;

        const remainingUploads = uploadLimit - totalDocsUploaded;
        if (selectedFiles.length > remainingUploads) {
            alert(`Upload limit reached. You can only upload ${remainingUploads} more document(s).`);
            return;
        }

        setIsUploading(true);
        setSuccessMessage(null);

        const initialProgress = selectedFiles.reduce((acc, file) => {
            acc[file.name] = { status: 'uploading' };
            return acc;
        }, {} as Record<string, UploadStatus>);
        setUploadProgress(initialProgress);

        const uploadPromises = selectedFiles.map(file =>
            dispatch(uploadDocumentThunk({userId, file }))
                .unwrap()
                .then(result => ({ ...result, fileName: file.name })) // Attach fileName for tracking
                .catch(error => Promise.reject({ ...error, fileName: file.name })) // Attach fileName to error
        );

        const results = await Promise.allSettled(uploadPromises);

        let successCount = 0;
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                setUploadProgress(prev => ({ ...prev, [result.value.fileName]: { status: 'succeeded' } }));
                successCount++;
            } else {
                const { fileName, message } = result.reason;
                console.error(`Failed to upload file ${fileName}:`, result.reason);
                setUploadProgress(prev => ({ ...prev, [fileName]: { status: 'failed', error: message || 'Upload failed' } }));
            }
        });

        setIsUploading(false);
        setSelectedFiles([]); // Clear selection after processing

        if (successCount > 0) {
            setSuccessMessage(`${successCount} document(s) accepted for processing.`);
            dispatch(fetchDocumentsThunk({ userId })); // Refresh list
        }
    };
    
    const handleDelete = async (docId: number) => {
        if (authToken && userId) {
            setSuccessMessage(null);
            setDeletingDocIds(prev => new Set(prev).add(docId));
            try {
                await dispatch(deleteDocumentThunk({ docId, userId })).unwrap();
                const docName = documents.find(d => d.id === docId)?.name || 'document';
                setSuccessMessage(`Document "${docName}" deleted successfully!`);
                dispatch(fetchDocumentsThunk({ userId })); // Refresh list
            } catch (error) {
                console.error(`Failed to delete document ${docId}:`, error);
            } finally {
                setDeletingDocIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(docId);
                    return newSet;
                });
            }
        }
    };

    // New handler for fetching document status directly
    const handleFetchStatus = async (docId: number) => {
        if (!authToken || !userId) {
            console.error('Authentication token or user ID missing.');
            return;
        }

        setLocalDocumentStatus(prev => ({
            ...prev,
            [docId]: { status: null, error: null, loading: true }
        }));

        try {
            const data = await fetchDocumentStatus(docId, userId);
            setLocalDocumentStatus(prev => ({
                ...prev,
                [docId]: { status: data.status, error: null, loading: false }
            }));
        } catch (error: any) {
            console.error(`Failed to fetch status for document ${docId}:`, error);
            setLocalDocumentStatus(prev => ({
                ...prev,
                [docId]: { status: null, error: error.message || 'Failed to fetch status', loading: false }
            }));
        }
    };

    // --- Render ---
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-zinc-800 transition-colors duration-300 font-inter">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-gray-100 dark:bg-zinc-900 p-4 flex flex-col rounded-r-3xl shadow-lg">
                <div className="mb-6 space-y-4">
                    <Button variant={view === 'list' ? 'primary' : 'secondary'} className="w-full justify-center" onClick={() => { setView('list'); setSuccessMessage(null); setUploadProgress({}); }}>List Documents</Button>
                    <Button variant={view === 'upload' ? 'primary' : 'secondary'} className="w-full justify-center" onClick={() => { setView('upload'); setSuccessMessage(null); }}>Upload Documents</Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center p-4">
                <Header appname="JaspAI Documents" isAuthenticated={isAuthenticated} />

                <div className="w-full max-w-3xl px-4 py-4 text-center">
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        Total Documents Uploaded: <span className="font-bold">{totalDocsUploaded}</span> / Upload Limit: <span className="font-bold">{uploadLimit}</span>
                    </p>
                </div>

                {successMessage && (
                    <div className="w-full max-w-3xl px-4 py-2 mb-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-md text-center">
                        {successMessage}
                    </div>
                )}
                
                {view === 'list' ? (
                    // --- List View ---
                    <div className="flex-grow w-full max-w-3xl px-4 overflow-y-auto">
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Your Documents</h2>
                        {documentsStatus === 'loading' && documents.length === 0 && <p className="text-center text-blue-500">Loading...</p>}
                        {documentsStatus === 'failed' && <p className="text-center text-red-500">Error: {documentsError}</p>}
                        
                        {(documentsStatus === 'succeeded' || (documentsStatus === 'loading' && documents.length > 0)) && documents.length > 0 ? (
                            <div className="space-y-4">
                                {documents.map(doc => {
                                    const isDeleting = deletingDocIds.has(doc.id);
                                    const docLocalStatus = localDocumentStatus[doc.id];
                                    const displayStatus = docLocalStatus?.status;
                                    const displayError = docLocalStatus?.error;
                                    const isLoadingStatus = docLocalStatus?.loading;

                                    return (
                                        <div key={doc.id} className={`flex items-center justify-between p-4 bg-white dark:bg-zinc-700 rounded-lg shadow-sm transition-all ${isDeleting ? 'opacity-50 blur-[1px]' : ''}`}>
                                            <div className="flex-grow">
                                                <span className="text-lg text-gray-800 dark:text-gray-200">{doc.name}</span>
                                                {displayStatus && (
                                                    <p className={`text-sm mt-1 ${displayStatus === 'trained' ? 'text-green-600' : 'text-orange-600'} dark:text-gray-300`}>
                                                        Status: <span className="font-semibold">{displayStatus}</span>
                                                    </p>
                                                )}
                                                {isLoadingStatus && <p className="text-sm text-blue-500 mt-1">Fetching status...</p>}
                                                {displayError && <p className="text-sm text-red-500 mt-1">Error: {displayError}</p>}
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                                <Button variant="secondary" size="sm" onClick={() => handleFetchStatus(doc.id)} disabled={isLoadingStatus}>
                                                    {isLoadingStatus ? '...' : 'Status'}
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)} disabled={isDeleting}>
                                                    {isDeleting ? '...' : 'Delete'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            documentsStatus === 'succeeded' && documents.length === 0 && (
                                <p className="text-center text-gray-600 dark:text-gray-400">No documents found. Upload some!</p>
                            )
                        )}
                    </div>
                ) : (
                    // --- Upload View ---
                    <div className="flex-grow w-full max-w-3xl px-4 flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Upload New Document</h2>
                        
                        {/* Dropzone */}
                        <div
                            className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                            onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                            onClick={() => document.getElementById('fileInput')?.click()}
                        >
                            <input type="file" id="fileInput" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.csv,.xls,.xlsx" multiple />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-4 text-gray-500 dark:text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 1.5A2.25 2.25 0 0 0 4.5 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V3.75A2.25 2.25 0 0 0 17.25 1.5H6.75Z" /></svg>
                            <p className="text-gray-600 dark:text-gray-300 mb-2">Drag & drop files here, or click to browse</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">(PDF, DOCX, CSV, Excel only)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 500MB per file, 1GB total.</p>
                        </div>

                        {/* Files to Upload & Progress */}
                        {selectedFiles.length > 0 && (
                            <div className="w-full mt-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Files to Upload:</h3>
                                <ul className="mt-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 space-y-1">
                                    {selectedFiles.map((file, index) => (
                                        <li key={index} className="flex justify-between items-center text-sm p-1">
                                            <span className="truncate text-gray-800 dark:text-gray-200">{file.name}</span>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                <button onClick={() => removeFile(file.name)} disabled={isUploading} className="text-red-500 hover:text-red-700 disabled:opacity-50" title="Remove file"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="primary" className="mt-4 w-full justify-center" onClick={handleUpload} disabled={isUploading || (totalDocsUploaded + selectedFiles.length > uploadLimit)}>
                                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                                </Button>
                            </div>
                        )}
                        
                        {Object.keys(uploadProgress).length > 0 && (
                            <div className="w-full mt-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Upload Status:</h3>
                                <div className="mt-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 space-y-1">
                                    {Object.entries(uploadProgress).map(([name, p]) => (
                                        <div key={name} className="flex justify-between items-center text-sm p-1">
                                            <span className="truncate text-gray-800 dark:text-gray-200">{name}</span>
                                            {p.status === 'uploading' && <span className="text-blue-500">Uploading...</span>}
                                            {p.status === 'succeeded' && <span className="text-green-500 font-semibold">✔ Accepted</span>}
                                            {p.status === 'failed' && <span className="text-red-500 font-semibold" title={p.error}>✖ Failed</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {totalDocsUploaded >= uploadLimit && view === 'upload' && !selectedFiles.length && (
                            <p className="text-orange-500 dark:text-orange-400 mt-4">You have reached your upload limit ({uploadLimit} documents).</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DocumentPage;