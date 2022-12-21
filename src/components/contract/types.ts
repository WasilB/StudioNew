import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class AddressDTO {
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;
}

export class mintDTO {
  tokenId: number;
  @IsEthereumAddress()
  walletAddress: string;
}

export class burnDTO {
  tokenId: number;
  @IsEthereumAddress()
  walletAddress: string;
}

export class tokenDTO {
  id: number;
}
