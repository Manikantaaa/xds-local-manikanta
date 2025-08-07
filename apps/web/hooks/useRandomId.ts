
const UniqueFormId = (userId: number | undefined) => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `formid_`+userId+`_`+timestamp.toString() + random.toString();
}

export default UniqueFormId;