const Web3 = require('web3');
import erc721 from 'src/components/config/abi/erc721';

export const init721Contract = (address: string) => {
  const web3 = new Web3(process.env.RPC_URL);
  const contractObject = new web3.eth.Contract(erc721, address);
  return contractObject;
};
