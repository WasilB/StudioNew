const Web3 = require('web3');
import erc721 from 'src/components/config/abi/erc721';

export const init721Contract = (address: string) => {
  const web3 = initWeb3();
  const contractObject = new web3.eth.Contract(erc721, address);
  return contractObject;
};

export const initWeb3 = () => {
  const web3 = new Web3(process.env.RPC_URL);
  return web3
};

export const isJsonString = (string: string) => {
  try {
    JSON.parse(string);
  } catch (e) {
    return false;
  }
  return true;
}

export const validateMetadata = (string: string) => {
  try {
    let metadataObject = JSON.parse(string);
    if (!metadataObject.name || metadataObject.name.replace(/\s+/g, '') == "" || !metadataObject.description || metadataObject.description.replace(/\s+/g, '') == "" || !metadataObject.image || metadataObject.image.replace(/\s+/g, '') == "") {
      return false;
    }

  } catch (e) {
    return false;
  }
  return true;
}

