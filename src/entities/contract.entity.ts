import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('Contract')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  number: number;
  @Column()
  tokenID: number;
  @Column()
  address: string;
}
