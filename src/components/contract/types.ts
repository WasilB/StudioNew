import { IsEthereumAddress, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class AddressDTO {
  @IsEthereumAddress()
  @IsNotEmpty()
  wallet_address: string;
}

export class MintTokenDTO {

  @IsNotEmpty()
  @IsNumber()
  count: number;

  @IsNotEmpty()
  @IsString()
  metadata: string;
}

export class BurnTokenDTO {

  @IsNotEmpty()
  @IsNumber()
  token_id: number;

  @IsEthereumAddress()
  wallet_address: string;
}

export class tokenDTO {

  @IsNotEmpty()
  token_id: string;
}


export class UpdateTokenDTO {

  @IsNotEmpty()
  @IsNumber()
  token_id: number;

  @IsNotEmpty()
  @IsString()
  metadata: string;
}
