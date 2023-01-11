import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from '../../entities/contract.entity';
import { Repository } from 'typeorm';
import { MintTokenDTO, UpdateTokenDTO } from './types';
import { init721Contract, initWeb3, isJsonString, validateMetadata, validateMetadataArray } from '../../utils/initContract';
import { HttpService } from '@nestjs/axios';
import { AddressDTO } from './types';
import { Response } from 'express';
import { BurnTokenDTO, tokenDTO } from './types';
import { Metadata } from 'src/entities/metadata.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractModel: Repository<Contract>,
    @InjectRepository(Metadata)
    private readonly metadataModel: Repository<Metadata>,
    private readonly httpService: HttpService,
  ) { }
  async getMaxSupply(response: Response) {
    try {
      const maxSupply = await this.getTokenMaxSupply()
      return response.status(200).json({
        success: true,
        max_supply: maxSupply,
      });
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getCirculatingSupply(response: Response) {
    try {
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const circulatingSupply = await contractObject.methods.getCirculatingSupply().call();
      return response.status(200).json({
        success: true,
        circulating_supply: parseInt(circulatingSupply),
      });
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTokenMetadata(tokenDTO: tokenDTO, response: Response) {
    try {
      const tokenId = parseInt(tokenDTO.token_id);
      const maxSupply = await this.getTokenMaxSupply()
      if (isNaN(tokenId) || tokenId < 0 || tokenId > maxSupply) {
        return response.status(400).json({
          success: false,
          message: 'Invalid token id',
        });
      }
      let metadata = await this.metadataModel.findOne({ where: { tokenID: tokenId } })
      if (!metadata) {
        return response.status(400).json({
          success: false,
          message: 'Metadata not found',
        });
      }
      metadata.metadata = JSON.parse(metadata.metadata)
      let apiResponse = metadata.metadata
      apiResponse['token_id'] = metadata.tokenID
      apiResponse['status'] = metadata.status
      return response.status(200).json(
        apiResponse
      );
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBalance(addressDTO: AddressDTO, response: Response) {
    try {
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const data = await contractObject.methods
        .balanceOf(addressDTO.wallet_address)
        .call();
      return response.status(200).json({
        success: true,
        balance: parseInt(data),
      });
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async tokenURI(tokenDTO: tokenDTO, response: Response) {
    try {
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const tokenURI = await contractObject.methods.tokenURI(tokenDTO.token_id).call();
      const tokenMetaData = await this.httpService.axiosRef.get(
        `https://${tokenURI}`,
      );

      return response.status(200).json({
        success: true,
        metadata: tokenMetaData.data,
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async mintToken(mintDTO: MintTokenDTO, response: Response) {
    try {
      if (!isJsonString(mintDTO.metadata)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid metadata',
        });
      }
      if (!validateMetadataArray(mintDTO.metadata)) {
        return response.status(400).json({
          success: false,
          message: 'Metadata mandatory fields are missing or empty',
        });
      }

      if (mintDTO.count != JSON.parse(mintDTO.metadata).length) {
        return response.status(400).json({
          success: false,
          message: 'Mint count and metadata length should be equal',
        });
      }
      const web3 = initWeb3();
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const gasPrice = await web3.eth.getGasPrice();
      const currentTokenId = await contractObject.methods.getCirculatingSupply().call();
      let currentId = parseInt(currentTokenId)
      const txData = await contractObject.methods.mint(mintDTO.count).encodeABI();
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          data: txData,
          from: process.env.OWNER_ADDRESS.toLowerCase(),
          gas: 4000000,
          gasPrice: gasPrice,
          to: process.env.CONTRACT_ADDRESS,
        },
        process.env.PRIVATE_KEY,
      );
      const transaction = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      if (transaction.status) {
        const metadatasArray = JSON.parse(mintDTO.metadata)
        for (const metadata of metadatasArray) {
          await this.metadataModel.insert({
            metadata: JSON.stringify(metadata),
            tokenID: currentId + 1
          })
          currentId++
        }
        const currentTokenId = await contractObject.methods.getCirculatingSupply().call();
        return response.status(200).json({
          success: true,
          message: 'Token minted successfully',
        });
      }
      return response.status(400).json({
        success: false,
        message: 'Internal server error',
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async burnToken(burnDTO: BurnTokenDTO, response: Response) {
    try {
      let metadata = await this.metadataModel.findOne({ where: { tokenID: burnDTO.token_id } })
      const maxSupply = await this.getTokenMaxSupply()
      if (isNaN(burnDTO.token_id) || burnDTO.token_id < 0 || burnDTO.token_id > maxSupply) {
        return response.status(400).json({
          success: false,
          message: 'Invalid token id',
        });
      }
      if (!metadata) {
        return response.status(400).json({
          success: false,
          message: 'Metadata not found',
        });
      }
      if (!metadata.status) {
        return response.status(400).json({
          success: false,
          message: 'Token already burned',
        });
      }
      const web3 = initWeb3();
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const gasPrice = await web3.eth.getGasPrice();
      const txData = await contractObject.methods.burn(burnDTO.token_id).encodeABI();
      const signedTx = await web3.eth.accounts.signTransaction(
        {
          data: txData,
          from: process.env.OWNER_ADDRESS.toLowerCase(),
          gas: 4000000,
          gasPrice: gasPrice,
          to: process.env.CONTRACT_ADDRESS,
        },
        process.env.PRIVATE_KEY,
      );
      const burnTransaction = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      if (burnTransaction.status) {
        metadata.status = false
        await this.metadataModel.save(metadata)
        return response.status(200).json({
          success: true,
          message: 'Token burned successfully',
        });
      }

    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  async updateMetadata(updateTokenDTO: UpdateTokenDTO, response: Response) {
    try {
      if (!isJsonString(updateTokenDTO.metadata)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid metadata',
        });
      }
      if (!validateMetadata(updateTokenDTO.metadata)) {
        return response.status(400).json({
          success: false,
          message: 'Metadata mandatory fields are missing or empty',
        });
      }
      let metadata = await this.metadataModel.findOne({ where: { tokenID: updateTokenDTO.token_id } })
      const maxSupply = await this.getTokenMaxSupply()
      if (isNaN(updateTokenDTO.token_id) || updateTokenDTO.token_id < 0 || updateTokenDTO.token_id > maxSupply) {
        return response.status(400).json({
          success: false,
          message: 'Invalid token id',
        });
      }
      if (!metadata) {
        return response.status(400).json({
          success: false,
          message: 'Metadata not found',
        });
      }
      if (!metadata.status) {
        return response.status(400).json({
          success: false,
          message: 'Burned token metadata cannot be updated',
        });
      }
      metadata.metadata = updateTokenDTO.metadata
      await this.metadataModel.save(metadata)
      return response.status(200).json({
        success: true,
        metadata: updateTokenDTO.metadata,
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTokenMaxSupply() {
    const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
    const maxSupply = await contractObject.methods.getMaxSupply().call();
    return parseInt(maxSupply)

  }

}
