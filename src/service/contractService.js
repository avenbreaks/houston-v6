/* eslint-disable no-unused-vars */
// noinspection ES6UnusedImports

import stakingAbi from '../abis/Staking.json';
import stakingStorage from '../abis/StakingStorage.json';
import profileAbi from '../abis/Profile.json';
import profileStorage from '../abis/ProfileStorage.json';
import IdentityStorage from '../abis/identityStorage.json';
import hubContractAbi from '../abis/HubContract.json';
import { ethers } from 'ethers';

import {
  STAKING_CONTRACT_ADDRESS,
  PROFILE_CONTRACT_ADDRESS,
  STAKING_STORAGE_CONTRACT_ADDRESS,
  HUB_CONTRACT_ADDRESS,
} from '@/utils/constants';

class ContractService {
  constructor(web3, ethersSigner) {
    this.web3 = web3;
    this.ethersSigner = ethersSigner;
  }

  async getContractAddress(contractName) {
    if (!this[contractName]) {
      this[contractName] = await this.getContractAddressesFromHubContract(contractName);
    }
    return this[contractName];
  }
  getContractAddressesFromHubContract(contractName) {
    const hubContract = new this.web3.eth.Contract(hubContractAbi, HUB_CONTRACT_ADDRESS);
    return hubContract.methods.getContractAddress(contractName).call();
  }

  async getIdentity(operationalAddress, adminWalletAddress) {
    const address = await this.getContractAddress('IdentityStorage');
    const IdentityStorageProfile = new this.web3.eth.Contract(IdentityStorage, address);
    const identity = await IdentityStorageProfile.methods
      .getIdentityId(operationalAddress)
      .call({ from: this.web3.eth.defaultAccount });
    const adminKey = ethers.utils.keccak256(
      ethers.utils.solidityPack(['address'], [adminWalletAddress]),
    );
    const hasPurpose = await IdentityStorageProfile.methods
      .keyHasPurpose(identity, adminKey, 1)
      .call({ from: this.web3.eth.defaultAccount });
    console.log(hasPurpose, identity, adminWalletAddress, adminKey);
    return hasPurpose ? identity : identity;
    //return hasPurpose ? identity : 0;
  }

  async getAsk(identityId) {
    const address = await this.getContractAddress('ProfileStorage');
    const ProfileStorageContract = new this.web3.eth.Contract(profileStorage, address);
    return ProfileStorageContract.methods.getAsk(identityId).call();
  }

  addStake(address, identityId, stakeAmount) {
    const stakeContract = new this.web3.eth.Contract(stakingAbi, STAKING_CONTRACT_ADDRESS);
    return stakeContract.methods.addStake(address, identityId, stakeAmount).send();
  }

  startStakeWithdrawal(address, sharesToBurn) {
    const stakeContract = new this.web3.eth.Contract(stakingAbi, STAKING_CONTRACT_ADDRESS);
    return stakeContract.methods.startStakeWithdrawal(address, sharesToBurn).send();
  }

  withdrawStake(identityId) {
    const stakeContract = new this.web3.eth.Contract(stakingAbi, STAKING_CONTRACT_ADDRESS);
    return stakeContract.methods.withdrawStake(identityId).send();
  }

  setAsk(identityId, ask) {
    const stakeContract = new this.web3.eth.Contract(profileAbi, PROFILE_CONTRACT_ADDRESS);
    return stakeContract.methods.setAsk(identityId, ask).send();
  }

  getTotalStake(identityId) {
    const stakeContract = new this.web3.eth.Contract(
      stakingStorage,
      STAKING_STORAGE_CONTRACT_ADDRESS,
    );
    return stakeContract.methods.totalStakes(identityId).call();
  }
}

export default ContractService;