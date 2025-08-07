import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

interface FileContextType {
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
}

export const FileContext = createContext<FileContextType | null>(null);

interface FileProviderProps {
  children: ReactNode; // This specifies that children is a valid prop of type ReactNode
}

export const ExcelFileStoreContext: React.FC<FileProviderProps> = ({
  children,
}) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <FileContext.Provider value={{ file, setFile }}>
      {children}
    </FileContext.Provider>
  );
};
