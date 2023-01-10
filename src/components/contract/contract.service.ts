import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from '../../entities/contract.entity';
import { Repository } from 'typeorm';
import { MintTokenDTO, UUIDDTO } from './types';
import { init721Contract, initWeb3 } from '../../utils/initContract';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { AddressDTO } from './types';
import { Response } from 'express';
import { BurnTokenDTO, tokenDTO } from './types';
import console from 'console';
import { Metadata } from 'src/entities/metadata.entity';
import { throws } from 'assert';
import { min } from 'class-validator';
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
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const maxSupply = await contractObject.methods.getMaxSupply().call();
      return response.status(200).json({
        success: true,
        max_supply: parseInt(maxSupply),
      });
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTokenMetadata(uuidDTO: UUIDDTO, response: Response) {
    try {
      let metadata = await this.metadataModel.findOne({where:{id:uuidDTO.id}})
      metadata.metadata= JSON.parse(metadata.metadata)
      return response.status(200).json({
        success: true,
        metadata
      });
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

      if (mintDTO.count != JSON.parse(mintDTO.metadata).length){
        return response.status(400).json({
          success: false,
          message: 'Mint count and metadata length should be equal',
        });
      }
      const web3 = initWeb3();
      const contractObject = await init721Contract(process.env.CONTRACT_ADDRESS);
      const gasPrice = await web3.eth.getGasPrice();
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
                metadata:JSON.stringify(metadata)
             })
        }
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
      await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      return response.status(200).json({
        success: true,
        message: 'Token burned successfully',
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  async updateMetadata(burnDTO: BurnTokenDTO, response: Response) {
    try {
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
      await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      return response.status(200).json({
        success: true,
        message: 'Token burned successfully',
      });
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
