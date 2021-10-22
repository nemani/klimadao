import { ethers } from "ethers";
import { getMarketPrice, contractForBond, contractForReserve } from "../helpers";
import { addresses, Actions, BONDS, VESTING_TERM } from "../constants";
import { abi as BondOhmDaiCalcContract } from "../abi/bonds/OhmDaiCalcContract.json";

export const fetchBondSuccess = payload => ({
  type: Actions.FETCH_BOND_SUCCESS,
  payload,
});

export const changeApproval =
  ({ bond, provider, address, networkID }) =>

  async dispatch => {
    if (!provider) {
      alert("Please connect your wallet!");
      return;
    }
    const signer = provider.getSigner();
    const reserveContract = contractForReserve({ bond, networkID, provider: signer });

    try {
      let approveTx;
      if (bond == BONDS.ohm_dai)
        approveTx = await reserveContract.approve(
          addresses[networkID].BONDS.OHM_DAI,
          ethers.utils.parseUnits("1000000000", "ether").toString(),
        );
      else if (bond === BONDS.dai)
        approveTx = await reserveContract.approve(
          addresses[networkID].BONDS.DAI,
          ethers.utils.parseUnits("1000000000", "ether").toString(),
        );
      else if (bond === BONDS.bct_usdc)
        approveTx = await reserveContract.approve(
          addresses[networkID].BONDS.BCT_USDC,
          ethers.utils.parseUnits("1000000000", "ether").toString(),
        );
      await approveTx.wait(1);
    } catch (error) {
      alert(error.message);
    }
  };

export const calcBondDetails =
  ({ bond, value, provider, networkID }) =>
  async dispatch => {
    let amountInWei;
    if (!value || value === "") {
      amountInWei = ethers.utils.parseEther("0.0001"); // Use a realistic SLP ownership
    } else {
      amountInWei = ethers.utils.parseEther(value);
    }

    // const vestingTerm = VESTING_TERM; // hardcoded for now
    let bondDiscount;
    let valuation;
    let bondQuote;
    const bondContract = contractForBond({ bond, networkID, provider });
    const marketPrice = await getMarketPrice({ networkID, provider });
    const terms = await bondContract.terms();
    const maxBondPrice = await bondContract.maxPayout();
    const debtRatio = await bondContract.debtRatio();
    const bondPrice = await bondContract.bondPriceInUSD();

    if (bond === BONDS.ohm_dai) {
      const bondCalcContract = new ethers.Contract(
        addresses[networkID].BONDS.OHM_DAI_CALC,
        BondOhmDaiCalcContract,
        provider,
      );
      bondDiscount = (marketPrice * Math.pow(10, 9) - bondPrice) / bondPrice; // 1 - bondPrice / (marketPrice * Math.pow(10, 9));

      // RFV = assume 1:1 backing
      valuation = await bondCalcContract.valuation(addresses[networkID].LP_ADDRESS, amountInWei);
      bondQuote = await bondContract.payoutFor(valuation);
      bondQuote /= Math.pow(10, 9);
    } else if (bond === BONDS.dai) {
      bondDiscount = (marketPrice * Math.pow(10, 9) - bondPrice) / bondPrice; // 1 - bondPrice / (marketPrice * Math.pow(10, 9));

      // RFV = DAI
      bondQuote = await bondContract.payoutFor(amountInWei);
      bondQuote /= Math.pow(10, 18);
    } else if (bond === BONDS.bct_usdc) {

      const bondCalcContract = new ethers.Contract(
        addresses[networkID].BONDS.OHM_DAI_CALC,
        BondOhmDaiCalcContract,
        provider,
      );
      bondDiscount = (marketPrice * Math.pow(10, 9) - bondPrice) / bondPrice; // 1 - bondPrice / (marketPrice * Math.pow(10, 9));

      // RFV = assume 1:1 backing
      valuation = await bondCalcContract.valuation(addresses[networkID].RESERVES.BCT_USDC, amountInWei);
      bondQuote = await bondContract.payoutFor(valuation);
      bondQuote /= Math.pow(10, 9);

    }

    // Display error if user tries to exceed maximum.
    if (!!value && parseFloat(bondQuote) > maxBondPrice / Math.pow(10, 9)) {
      alert(
        "You're trying to bond more than the maximum payout available! The maximum bond payout is " +
          (maxBondPrice / Math.pow(10, 9)).toFixed(2).toString() +
          " KLIMA.",
      );
    }
    return dispatch(
      fetchBondSuccess({
        bond,
        bondDiscount,
        debtRatio,
        bondQuote,
        vestingTerm: parseInt(terms.vestingTerm),
        maxBondPrice: maxBondPrice / Math.pow(10, 9),
        bondPrice: bondPrice / Math.pow(10, 18),
        marketPrice: marketPrice / Math.pow(10, 9),
      }),
    );
  };

export const calculateUserBondDetails =
  ({ address, bond, networkID, provider }) =>
  async dispatch => {
    if (!address) return;

    // Calculate bond details.
    const bondContract = contractForBond({ bond, provider, networkID });
    const reserveContract = contractForReserve({ bond, networkID, provider });
    let interestDue;
    let pendingPayout;
    let bondMaturationBlock;
    if (bond === BONDS.dai_v1) {
      const bondDetails = await bondContract.depositorInfo(address);
      interestDue = bondDetails[1];
      bondMaturationBlock = +bondDetails[3] + +bondDetails[2];
      pendingPayout = await bondContract.calculatePendingPayout(address);
    } else {
      let bondDetails = [0, 0, 0, 0];
      try {
        bondDetails = await bondContract.bondInfo(address);
      } catch (e) {
        console.log(e);
      }
      interestDue = bondDetails[0];
      bondMaturationBlock = +bondDetails[1] + +bondDetails[2];
      pendingPayout = await bondContract.pendingPayoutFor(address);
    }

    let allowance;
    let balance;
    if (bond === "klima_bct_lp") {
      allowance = await reserveContract.allowance(address, addresses[networkID].BONDS.OHM_DAI);

      balance = await reserveContract.balanceOf(address);
      balance = ethers.utils.formatUnits(balance, "ether");
    } else if (bond === BONDS.dai) {
      allowance = await reserveContract.allowance(address, addresses[networkID].BONDS.DAI);

      balance = await reserveContract.balanceOf(address);
      balance = ethers.utils.formatEther(balance);
    } else if (bond === "bct_usdc_lp") {
      allowance = await reserveContract.allowance(address, addresses[networkID].BONDS.BCT_USDC);

      balance = await reserveContract.balanceOf(address);
      balance = ethers.utils.formatEther(balance);
    }

    return dispatch(
      fetchBondSuccess({
        bond,
        allowance,
        balance,
        interestDue: ethers.utils.formatUnits(interestDue, "gwei"),
        bondMaturationBlock,
        pendingPayout: ethers.utils.formatUnits(pendingPayout, "gwei"),
      }),
    );
  };

export const bondAsset =
  ({ value, address, bond, networkID, provider, slippage }) =>
  async dispatch => {
    const depositorAddress = address;
    const acceptedSlippage = slippage / 100 || 0.02; // 2%
    const valueInWei = ethers.utils.parseUnits(value.toString(), "ether");

    let balance;

    // Calculate maxPremium based on premium and slippage.
    // const calculatePremium = await bonding.calculatePremium();
    const signer = provider.getSigner();
    const bondContract = contractForBond({ bond, provider: signer, networkID });
    const calculatePremium = await bondContract.bondPrice();
    const maxPremium = Math.round(calculatePremium * (1 + acceptedSlippage));

    // Deposit the bond
    try {
      const bondTx = await bondContract.deposit(valueInWei, maxPremium, depositorAddress);
      await bondTx.wait(1);

      const reserveContract = contractForReserve({ bond, provider, networkID });

      if (bond === BONDS.ohm_dai) {
        balance = await reserveContract.balanceOf(address);
      } else if (bond === BONDS.dai) {
        balance = await reserveContract.balanceOf(address);
        balance = ethers.utils.formatEther(balance);
      }

      return dispatch(fetchBondSuccess({ bond, balance }));
    } catch (error) {
      if (error.code === -32603 && error.message.indexOf("ds-math-sub-underflow") >= 0) {
        alert("You may be trying to bond more than your balance! Error code: 32603. Message: ds-math-sub-underflow");
      } else if (error && error.data && error.data.message) {
        alert(error.data.message);
      } else {
        alert(error.message);
      }
    }
  };
//
export const redeemBond =
  ({ address, bond, networkID, provider, autostake }) =>
  async dispatch => {
    if (!provider) {
      alert("Please connect your wallet!");
      return;
    }

    const signer = provider.getSigner();
    const bondContract = contractForBond({ bond, networkID, provider: signer });

    try {
      let redeemTx;
      if (bond === BONDS.dai_v1) {
        redeemTx = await bondContract.redeem();
      } else {
        redeemTx = await bondContract.redeem(address, autostake);
      }

      await redeemTx.wait(1);
    } catch (error) {
      alert(error.message);
    }
  };
