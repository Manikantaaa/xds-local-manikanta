let excelData: any;

export const setFile = (data: any) => {
  excelData = data;
};

export const getFile = () => {
  return excelData;
};
