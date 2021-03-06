import { useEffect, useState } from "react";
import type { NextPage } from "next";

import { OrderStatus, PaymentChargeStatusEnum, useFetchVariousNumberOfOrdersQuery } from "../generated/graphql";
import useApp from "../hooks/useApp";
import { SALEOR_DOMAIN_HEADER } from "../constants";
import { Paper, TableBody, TableCell, TableHead, TableRow, Typography } from "@material-ui/core";
import { makeStyles, Pill, ResponsiveTable } from "@saleor/macaw-ui";
import { CSSProperties } from "@material-ui/core/styles/withStyles";

const useStyles = makeStyles(
  theme => {
    const overflowing: CSSProperties = {
      overflow: "hidden",
      textOverflow: "ellipsis"
    };

    return {
      [theme.breakpoints.up("lg")]: {
        colCustomer: {
          width: 220
        },
        colDate: {},
        colFulfillment: {
          width: 230
        },
        colNumber: {
          width: 120
        },
        colPayment: {
          width: 220
        },
        colTotal: {}
      },
      pill: {
        maxWidth: "100%",
        ...overflowing
      },
      colCustomer: overflowing,
      colDate: {},
      colFulfillment: {},
      colNumber: {},
      colPayment: {},
      colTotal: {
        textAlign: "right"
      },
      link: {
        cursor: "pointer"
      },
      currency: {
        fontSize: "0.875em",
        marginRight: "0.5rem"
      },
      pageHeader: {
        marginBottom: "2.4rem"
      }
    };
  },
  { name: "OrderList" }
);

const Orders: NextPage = () => {
  const classes = useStyles();
  const appState = useApp()?.getState();
  const [numberOfOrders, setNumberOfOrders] = useState<number>(100);

  useEffect(() => {
    appState?.domain && appState?.token && fetch(
      "/api/configuration/orders",
      {
        headers: [
          [SALEOR_DOMAIN_HEADER, appState.domain],
          ["authorization-bearer", appState.token!],
        ]
      },
    )
      .then((res) => res.json())
      .then((json) => {
        const number_of_orders: string | null = json.data?.number_of_orders;
        setNumberOfOrders(parseInt(number_of_orders || "100"));
      });
  }, [appState]);

  const [{ data, error, fetching }] = useFetchVariousNumberOfOrdersQuery({
    variables: { number_of_orders: numberOfOrders as number },
    pause: numberOfOrders === undefined,
  });

  return (
    <div>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
      <main>
        <div className={classes.pageHeader}>
          <Typography variant="h1">
            Guest orders
          </Typography>
        </div>

        <Paper>
          {error && <div>{error.message}</div>}
          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>No. of Order</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Fulfillment status</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>

              {fetching && <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>}


              {!fetching &&
                data?.orders?.edges.filter(({ node: order }) => !order.user?.id)
                  .map(({ node: order }) => (
                    <TableRow hover key={order.id}>
                      <TableCell className={classes.colNumber}>
                        {`#${order.number}`}
                      </TableCell>
                      <TableCell className={classes.colDate}>
                        {new Intl.DateTimeFormat('en-US').format(Date.parse(order.created))}
                      </TableCell>
                      <TableCell className={classes.colCustomer}>
                        {order.billingAddress?.firstName}
                        &nbsp;
                        {order.billingAddress?.lastName}
                      </TableCell>
                      <TableCell className={classes.colPayment}>
                        <Pill
                          className={classes.pill}
                          color={transformPaymentStatus(order.paymentStatus).status}
                          label={transformPaymentStatus(order.paymentStatus).localized}
                          css=""
                        />

                      </TableCell>
                      <TableCell className={classes.colFulfillment}>
                        <Pill
                          className={classes.pill}
                          color={transformOrderStatus(order.status).status}
                          label={transformOrderStatus(order.status).localized}
                          css=""
                        />

                      </TableCell>
                      <TableCell className={classes.colTotal} align="right">
                        <>
                          <span className={classes.currency}>{order.total.gross.currency}</span>
                          {order.total.gross.amount}
                        </>

                      </TableCell>
                    </TableRow>
                  ),
                    () => (
                      <TableRow>
                        <TableCell colSpan={6}>

                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </ResponsiveTable>
        </Paper>

      </main>
    </div>
  );
};

export default Orders;

export const transformPaymentStatus = (
  status: string
): { localized: string; status: StatusType } => {
  const localized = capitalize(status.replace('_', ' ').toLowerCase());

  switch (status) {
    case PaymentChargeStatusEnum.PartiallyCharged:
      return {
        localized,
        status: StatusType.ERROR
      };
    case PaymentChargeStatusEnum.FullyCharged:
      return {
        localized,
        status: StatusType.SUCCESS
      };
    case PaymentChargeStatusEnum.PartiallyRefunded:
      return {
        localized,
        status: StatusType.INFO
      };
    case PaymentChargeStatusEnum.FullyRefunded:
      return {
        localized,
        status: StatusType.INFO
      };
    case PaymentChargeStatusEnum.Pending:
      return {
        localized,
        status: StatusType.WARNING
      };
    case PaymentChargeStatusEnum.Refused:
      return {
        localized,
        status: StatusType.ERROR
      };
    case PaymentChargeStatusEnum.Cancelled:
      return {
        localized,
        status: StatusType.ERROR
      };
    case PaymentChargeStatusEnum.NotCharged:
      return {
        localized,
        status: StatusType.ERROR
      };
  }
  return {
    localized: status,
    status: StatusType.ERROR
  };
};

export const transformOrderStatus = (
  status: string
): { localized: string; status: StatusType } => {
  const localized = capitalize(status.replace('_', ' ').toLowerCase());

  switch (status) {
    case OrderStatus.Fulfilled:
      return {
        localized,
        status: StatusType.SUCCESS
      };
    case OrderStatus.PartiallyFulfilled:
      return {
        localized,
        status: StatusType.WARNING
      };
    case OrderStatus.Unfulfilled:
      return {
        localized,
        status: StatusType.ERROR
      };
    case OrderStatus.Canceled:
      return {
        localized,
        status: StatusType.ERROR
      };
    case OrderStatus.Draft:
      return {
        localized,
        status: StatusType.INFO
      };
    case OrderStatus.Unconfirmed:
      return {
        localized,
        status: StatusType.INFO
      };
    case OrderStatus.PartiallyReturned:
      return {
        localized,
        status: StatusType.INFO
      };
    case OrderStatus.Returned:
      return {
        localized,
        status: StatusType.INFO
      };
  }
  return {
    localized,
    status: StatusType.ERROR
  };
};

export enum StatusType {
  INFO = "info",
  ERROR = "error",
  WARNING = "warning",
  SUCCESS = "success"
}

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);