"use client";
import { 
  createContext, 
  Dispatch, 
  ReactNode, 
  SetStateAction, 
  useContext, 
  useEffect, 
  useState 
} from 'react';

interface RandomDataStoreProps {
  companyCounts: number,
  setCompanyCounts: Dispatch<SetStateAction<number>>;
};

// Create the context with an initial value
const RandomDataStoreContext = createContext<RandomDataStoreProps>({
  companyCounts: 0,
  setCompanyCounts: () => 0,
});

export const RandomDataStoreContextProvier = ({ children }: { children: ReactNode }) => {
  const [companyCounts, setCompanyCounts] = useState<number>(0);
  
  useEffect(() => {
    const comparingCompanies = localStorage.getItem("comparingCompanies");
    if(comparingCompanies) {
      const theCompanesArr = JSON.parse(comparingCompanies);
      setCompanyCounts(theCompanesArr.length);
    } else {
      setCompanyCounts(0)
    }
  }, [])
  
  return (
    <RandomDataStoreContext.Provider value={{ companyCounts, setCompanyCounts }}>
      {children}
    </RandomDataStoreContext.Provider>
  );
}

export const useRandomDataContext = () => useContext(RandomDataStoreContext);