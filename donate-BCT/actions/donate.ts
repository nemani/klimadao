import { ethers, providers } from "ethers";
import { OnStatusHandler } from "./utils";
import { addresses } from "@klimadao/lib/constants";

import IERC20 from "@klimadao/lib/abi/IERC20.json";
import DonationContract from "@klimadao/lib/abi/EarthDayDonationDrive.json";
import { formatUnits } from "@klimadao/lib/utils";

export const getApprovalAmount = async (params: {
  provider: providers.JsonRpcProvider;
}): Promise<string> => {
  try {
    const signer = params.provider.getSigner();
    const contract = new ethers.Contract(
      addresses["mainnet"].bct,
      IERC20.abi,
      signer
    );
    const address = addresses["mainnet"].donation_contract;
    const value = await contract.allowance(signer.getAddress(), address);
    return formatUnits(value, 18);
  } catch (error: any) {
    if (error.code === 4001) {
      throw error;
    }
    throw error;
  }
};

export const getStats = async (params: {
  provider: providers.JsonRpcProvider;
}): Promise<{ balance: string; totalDonated: string; donateGoal: string }> => {
  try {
    const signer = params.provider.getSigner();
    const contract = new ethers.Contract(
      addresses["mainnet"].donation_contract,
      DonationContract.abi,
      signer
    );
    const BCT_contract = new ethers.Contract(
      addresses["mainnet"].bct,
      IERC20.abi,
      params.provider.getSigner()
    );

    const balance = await BCT_contract.balanceOf(signer.getAddress());
    const totalDonated = await contract.balance();
    const donateGoal = await contract.targetAmount();

    return {
      balance: formatUnits(balance, 18),
      totalDonated: formatUnits(totalDonated, 18),
      donateGoal: formatUnits(donateGoal, 18),
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw error;
    }
    throw error;
  }
};

export const changeApprovalTransaction = async (params: {
  provider: providers.JsonRpcProvider;
  onStatus: OnStatusHandler;
  value: number;
}): Promise<string> => {
  try {
    const contract = new ethers.Contract(
      addresses["mainnet"].bct,
      IERC20.abi,
      params.provider.getSigner()
    );

    const address = addresses["mainnet"].donation_contract;

    const value = ethers.utils.parseUnits(params.value.toString(), "ether");

    params.onStatus("userConfirmation", "");

    const txn = await contract.approve(address, value.toString());
    params.onStatus("networkConfirmation", "");

    await txn.wait(1);

    params.onStatus("done", "Transaction approved successfully");
    return formatUnits(value, 18);
  } catch (error: any) {
    if (error.code === 4001) {
      params.onStatus("error", "userRejected");
      throw error;
    }
    params.onStatus("error");
    throw error;
  }
};

export const changeDonationTransaction = async (params: {
  value: number;
  provider: providers.JsonRpcProvider;
  onStatus: OnStatusHandler;
}) => {
  try {
    const contract = new ethers.Contract(
      addresses["mainnet"].donation_contract,
      DonationContract.abi,
      params.provider.getSigner()
    );

    params.onStatus("userConfirmation", "");

    const parsedValue = ethers.utils.parseUnits(
      params.value.toString(),
      "ether"
    );
    const txn = await contract.deposit(parsedValue);
    params.onStatus("networkConfirmation", "");

    await txn.wait(1);
    params.onStatus("done", "Transaction confirmed");
  } catch (error: any) {
    if (error.code === 4001) {
      params.onStatus("error", "userRejected");
      throw error;
    }
    params.onStatus("error");
    throw error;
  }
};
