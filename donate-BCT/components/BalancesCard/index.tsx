import { Text } from "@klimadao/lib/components";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import { trimWithPlaceholder } from "@klimadao/lib/utils";
import { InfoButton } from "components/InfoButton";
import * as styles from "./styles";
import { FC } from "react";
import { Trans } from "@lingui/macro";

interface Props {
  asset: string;
  tooltip: string;
  balance: string;
  label: string;
}

export const BalancesCard: FC<Props> = (props) => {
  return (
    <div className={styles.card}>
      <div className="header">
        <Text t="h4" className="title">
          <AccountBalanceOutlined />
          <Trans id="shared.balances">{props.label}</Trans>
        </Text>
        <InfoButton content={props.tooltip} />
      </div>
      <div className="cardContent">
        <div className="stack" key={props.asset}>
          <Text className="value">
            {trimWithPlaceholder(props.balance ?? 0, 9, "en")}
          </Text>
          <Text className="label" color="lightest">
            {props.label}
          </Text>
        </div>
      </div>
    </div>
  );
};
