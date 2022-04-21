import React, { useState } from "react";
import { useSelector } from "react-redux";
import { providers } from "ethers";
import { selectNotificationStatus } from "state/selectors";
import { setAppState, AppNotificationStatus, TxnStatus } from "state/app";
import SpaOutlined from "@mui/icons-material/SpaOutlined";

import {
  getApprovalAmount,
  changeApprovalTransaction,
  changeDonationTransaction,
} from "actions/donate";
import { useAppDispatch } from "state";
import { setDonateAllowance, donate } from "state/user";
import { selectBalances, selectDonateAllowance } from "state/selectors";

import { ButtonPrimary, Spinner, Text } from "@klimadao/lib/components";
import { concatAddress } from "@klimadao/lib/utils";
import { Trans, t } from "@lingui/macro";
import { BalancesCard } from "components/BalancesCard";
import { ImageCard } from "components/ImageCard";

import * as styles from "./styles";

interface ButtonProps {
  label: React.ReactElement | string;
  onClick: undefined | (() => void);
  disabled: boolean;
}

interface Props {
  provider: providers.JsonRpcProvider;
  address?: string;
  isConnected: boolean;
  loadWeb3Modal: () => void;
}

export const Donate = (props: Props) => {
  const dispatch = useAppDispatch();

  const fullStatus: AppNotificationStatus | null = useSelector(
    selectNotificationStatus
  );
  const status = fullStatus && fullStatus.statusType;

  const setStatus = (statusType: TxnStatus | null, message?: string) => {
    if (!statusType) return dispatch(setAppState({ notificationStatus: null }));
    dispatch(setAppState({ notificationStatus: { statusType, message } }));
  };

  const [quantity, setQuantity] = useState("");

  const donateAllowance = useSelector(selectDonateAllowance);
  const balances = useSelector(selectBalances);

  const isLoading =
    !donateAllowance || typeof donateAllowance.bct === "undefined";

  const getAllowance = async () => {
    const val: string = await getApprovalAmount({ provider: props.provider });
    dispatch(setDonateAllowance({ bct: val }));
    return val;
  };

  const setMax = () => {
    setStatus(null);
    setQuantity(balances?.bct ?? "0");
  };

  const handleApproval = (value: number) => async () => {
    try {
      const approvalValue = await changeApprovalTransaction({
        provider: props.provider,
        onStatus: setStatus,
        value,
      });
      dispatch(setDonateAllowance({ bct: approvalValue }));
    } catch (e) {
      return;
    }
  };

  const handleDonate = (value: number) => async () => {
    try {
      setQuantity("");
      await changeDonationTransaction({
        value,
        provider: props.provider,
        onStatus: setStatus,
      });
      dispatch(donate(value.toString()));
    } catch (e) {
      return;
    }
  };

  const hasApproval = (value: number) => {
    return donateAllowance && Number(donateAllowance.bct) > value;
  };

  const getButtonProps = (): ButtonProps => {
    const value = Number(quantity || "0");
    if (!props.isConnected || !props.address) {
      return {
        label: <Trans id="shared.connect_wallet">Connect wallet</Trans>,
        onClick: props.loadWeb3Modal,
        disabled: false,
      };
    } else if (isLoading) {
      return {
        label: <Trans id="shared.loading">Loading...</Trans>,
        onClick: undefined,
        disabled: true,
      };
    } else if (
      status === "userConfirmation" ||
      status === "networkConfirmation"
    ) {
      return {
        label: <Trans id="shared.confirming">Confirming</Trans>,
        onClick: undefined,
        disabled: true,
      };
    } else if (!hasApproval(value)) {
      return {
        label: <Trans id="shared.approve">Approve</Trans>,
        onClick: handleApproval(value),
        disabled: false,
      };
    } else if (hasApproval(value)) {
      return {
        label: value ? (
          <Trans id="stake.stake_klima">Donate BCT</Trans>
        ) : (
          <Trans id="shared.enter_amount">Enter Amount</Trans>
        ),
        onClick: handleDonate(value),
        disabled: !balances?.bct || !value || value > Number(balances.klima),
      };
    } else {
      return {
        label: <Trans id="shared.error">ERROR</Trans>,
        onClick: undefined,
        disabled: true,
      };
    }
  };

  const getInputPlaceholder = (): string => {
    return t({
      id: "donate.inputplaceholder",
      message: "Amount to donate",
    });
  };

  const showSpinner =
    props.isConnected &&
    (status === "userConfirmation" ||
      status === "networkConfirmation" ||
      !getAllowance() ||
      isLoading);

  return (
    <>
      <BalancesCard
        assets={["bct"]}
        tooltip={t({
          id: "donate.balancescard.tooltip",
          message: "Your current BCT balance",
          comment: "Long sentence",
        })}
      />

      <div className={styles.stakeCard}>
        <div className={styles.stakeCard_header}>
          <Text t="h4" className={styles.stakeCard_header_title}>
            <SpaOutlined />
            <Trans id="donate.donate_bct">Donate BCT</Trans>
          </Text>
          <Text t="caption" color="lightest">
            <Trans id="donate.donate_bct_for_earth_day" comment="Long sentence">
              Donate BCT for Earth Day
            </Trans>
          </Text>
        </div>
        <div className={styles.stakeCard_ui}>
          <div className={styles.inputsContainer}>
            <div className={styles.stakeInput}>
              <input
                className={styles.stakeInput_input}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setStatus(null);
                }}
                type="number"
                placeholder={getInputPlaceholder()}
                min="0"
              />
              <button
                className={styles.stakeInput_max}
                type="button"
                onClick={setMax}
              >
                <Trans id="shared.max">Max</Trans>
              </button>
            </div>
            {props.address && (
              <div className={styles.address}>
                {concatAddress(props.address)}
              </div>
            )}
            <div className="hr" />
          </div>

          <div className={styles.buttonRow}>
            {showSpinner ? (
              <div className={styles.buttonRow_spinner}>
                <Spinner />
              </div>
            ) : (
              <ButtonPrimary
                {...getButtonProps()}
                className={styles.submitButton}
              />
            )}
          </div>
        </div>
      </div>

      <ImageCard />
    </>
  );
};
