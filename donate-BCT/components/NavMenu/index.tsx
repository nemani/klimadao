import React, { FC, ReactElement, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectBalances } from "state/selectors";
import { Trans } from "@lingui/macro";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import {
  Anchor as A,
  DiscordIcon,
  GithubIcon,
  LinkedInIcon,
  LogoWithClaim,
  RedditIcon,
  RSSIcon,
  TelegramIcon,
  Text,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@klimadao/lib/components";
import { urls } from "@klimadao/lib/constants";
import { concatAddress } from "@klimadao/lib/utils";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import SpaOutlined from "@mui/icons-material/SpaOutlined";

import * as styles from "./styles";

interface MenuButtonProps {
  icon: ReactElement;
  href: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
const MenuButton: FC<MenuButtonProps> = (props) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // hack for server rendering mismatch. See comment in IsomorphicRoutes.tsx
    setLoading(false);
  }, []);

  if (props.disabled) {
    return (
      <div
        className={styles.sidebarButton}
        data-active={loading ? false : props.isActive}
        data-disabled={true}
      >
        <div className="iconContainer">{props.icon}</div>
        <span>{props.children}</span>
      </div>
    );
  }
  // to ensure server render match, return plain anchor until hydration is complete
  if (props.href.startsWith("http") || loading) {
    return (
      <a
        className={styles.sidebarButton}
        data-active={loading ? false : props.isActive}
        href={props.href}
      >
        <div className="iconContainer">{props.icon}</div>
        <span>{props.children}</span>
      </a>
    );
  }
  const handleClick = () => {
    props.onClick?.();
  };
  return (
    <Link
      onClick={handleClick}
      to={props.href}
      data-active={loading ? false : props.isActive}
      className={styles.sidebarButton}
    >
      <div className="iconContainer">{props.icon}</div>
      <span>{props.children}</span>
    </Link>
  );
};

interface Props {
  address?: string;
  onHide?: () => void;
}

export const NavMenu: FC<Props> = (props) => {
  const { pathname } = useLocation();

  const handleHide = () => {
    props.onHide?.();
  };

  return (
    <nav className={styles.container}>
      <a href={urls.home}>
        <LogoWithClaim />
      </a>
      <div className="stack-12">
        <div className="hr" />
        <div className="stack-04">
          <Text t="caption">
            <Trans id="menu.wallet_address">Your Wallet Address</Trans>:
          </Text>
          <Text t="caption" color="lightest">
            {props.address ? (
              concatAddress(props.address)
            ) : (
              <Trans id="menu.not_connected">NOT CONNECTED</Trans>
            )}
          </Text>
        </div>
        <div className="hr" />
      </div>

      <MenuButton
        isActive={pathname === "/donate"}
        href="/donate"
        icon={<SpaOutlined />}
        onClick={handleHide}
      >
        <Trans id="menu.donate_bct">Donate BCT</Trans>
      </MenuButton>

      <div className="navFooter">
        <div className="hr" />
        <div className="navFooter_buttons">
          <A className="navFooter_button" href={urls.twitter}>
            <TwitterIcon />
          </A>
          <A className="navFooter_button" href={urls.youtube}>
            <YoutubeIcon />
          </A>
          <A className="navFooter_button" href={urls.discordInvite}>
            <DiscordIcon />
          </A>
          <A className="navFooter_button" href={urls.reddit}>
            <RedditIcon />
          </A>
          <A className="navFooter_button" href={urls.twitch}>
            <TwitchIcon />
          </A>
          <A className="navFooter_button" href={urls.github}>
            <GithubIcon />
          </A>
          <A className="navFooter_button" href={urls.tiktok}>
            <TiktokIcon />
          </A>
          <A className="navFooter_button" href={urls.linkedIn}>
            <LinkedInIcon />
          </A>
          <A className="navFooter_button" href={urls.telegram}>
            <TelegramIcon />
          </A>
          <A className="navFooter_button" href={urls.podcast}>
            <RSSIcon />
          </A>
          <A className="navFooter_button" href={urls.officialDocs}>
            <MenuBookOutlined />
          </A>
        </div>
      </div>
    </nav>
  );
};
