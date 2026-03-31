import { createContext, useContext, useState } from "react";

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    const [activeMenu, setActiveMenu] = useState("home");

    return (
        <MenuContext.Provider value={{ activeMenu, setActiveMenu }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => useContext(MenuContext);