const getConfig = async (key: string) => {
    return await chrome.storage.local.get([key]);
};

const setConfig = async (key: string, value: any) => {
    await chrome.storage.local.set({ [key]: value });
};

const logStorage = () => {
    chrome.storage.local.get(null, (data) => {
        console.log(JSON.stringify(data, null, 2));
    });
};

const getTabInfo = async (url: string) => {
    console.log("MK URL:", url);

    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getTabInfo", url }, (response) => {
            resolve(response);
        });
    });
};

export { getConfig, setConfig, logStorage, getTabInfo };
