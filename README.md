# Infinix
Infinix the Logarithmic Perpetual Futures DEX with signals from API3 oracle.
Infinix is built on Perpetual Protocol and uses vAMM.

#### How is it different from Perpetual Protocol?

##### Business Value
Via the partnership with oracle API3 we can provide traders with Tier 1 market data signals for stocks, commodities, and other markets other than crypto.  Infinix is also an improvement over Perpetual Protocol, changing the way the orders are executed to gain spot exposure at higher leverages with longer funding periods. 

##### Technical Value
In Perpetual futures, short positions on leading exchanges are less desirable to traders than long ones since they are more likely to be liquidated. The resulting long-short imbalance causes market prices to improperly reflect expected future spot prices and increases the overall probability of liquidation events. Taking the log of the underlying asset’s price before computing funding payments eliminates this asymmetry. The corresponding financial derivative known as a logarithmic perpetual future can be used to gain spot exposure at higher leverage with longer funding periods than its nonlogarithmic counterpart.

In-depth documentation on Infinix is available at [***DOC LINK***]().

## Local development and testing

### Requirements

You should have Node 16 installed. Use [nvm](https://github.com/nvm-sh/nvm) to install it.

### Get started

Clone this repository, install NodeJS dependencies, and compile the contracts:
```
git clone git@github.com:infinix-finance/protocol.git
yarn
yarn compile
```

### Run Tests

To run all the test cases,
```
yarn test
```
