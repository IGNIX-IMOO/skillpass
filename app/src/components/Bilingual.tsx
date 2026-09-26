import type { ReactNode } from "react";

export function PageTitle({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <>
      <h1>{primary}</h1>
      <p className="page-title-secondary">{secondary}</p>
    </>
  );
}

export function TwoLineLabel({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <span className="two-line-label">
      <strong>{primary}</strong>
      <small>{secondary}</small>
    </span>
  );
}

export function ButtonLabel({
  primary,
  secondary,
  icon,
}: {
  primary: string;
  secondary: string;
  icon?: ReactNode;
}) {
  return (
    <>
      {icon}
      <span className="button-label">
        <strong>{primary}</strong>
        <small>{secondary}</small>
      </span>
    </>
  );
}
