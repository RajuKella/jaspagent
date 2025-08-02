// Header.tsx

import Button from "../components/Button";
import ThemeToggleButton from "../components/ThemeToggleButton";
import { NavLink } from "react-router-dom";
import useLogout from "../hooks/userLogout";


interface HeaderProps {
    appname: string;
    isAuthenticated: boolean;
}


const Header: React.FC<HeaderProps> = ({ appname, isAuthenticated}) => {
    const { handleLogout, handleLogin } = useLogout();     

    return (
        <div className="w-full flex px-4 py-4 items-center justify-between">
            <h1 className="text-2xl font-extrabold dark:text-gray-300">{appname}</h1>
            <div className="flex items-center space-x-4">
                <ThemeToggleButton/>
                
                {isAuthenticated ? (
                    <>
                        <NavLink to="/" className={({isActive, isPending})=> isPending ? "hover:cursor-pointer font-md text-gray-800 dark:text-gray-200" : isActive ? "underline font-bold text-gray-800 dark:text-gray-200" : "font-md text-gray-800 dark:text-gray-200"}>Chat</NavLink>
                        <NavLink to="/account" className={({isActive, isPending})=> isPending ? "hover:cursor-pointer font-md text-gray-800 dark:text-gray-200" : isActive ? "underline font-bold text-gray-800 dark:text-gray-200" : "font-md text-gray-800 dark:text-gray-200"}>Account</NavLink>
                        <NavLink to="/documents" className={({isActive, isPending})=> isPending ? "hover:cursor-pointer font-md text-gray-800 dark:text-gray-200" : isActive ? "underline font-bold text-gray-800 dark:text-gray-200" : "font-md text-gray-800 dark:text-gray-200"}>Documents</NavLink>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={handleLogout} 
                            className="border-gray-300 text-gray-700 hover:bg-gray-400"
                        >
                            Logout
                        </Button>
                    </>
                    
                ) : (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleLogin} 
                        className="border-gray-300 text-gray-700 hover:bg-gray-400"
                    >
                        Login
                    </Button>
                )}
            </div>
        </div>
    )
}

export default Header;