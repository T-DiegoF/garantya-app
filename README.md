# GarantYa — Frontend

Depósito de alquiler en blockchain. Avalanche Fuji Testnet.

## Setup

1. Cloná el repo y copiá el archivo de env:
```bash
cp .env.local.example .env.local
```

2. Completá las variables:
```
NEXT_PUBLIC_WALLET_CONNECT_ID=  # Obtené uno gratis en cloud.walletconnect.com
NEXT_PUBLIC_FACTORY_ADDRESS=    # Address de tu Factory deployada en Fuji
```

3. Instalá dependencias y arrancá:
```bash
npm install
npm run dev
```

## Estructura

```
src/
  app/
    page.tsx                    ← Pantalla 1: Nuevo contrato
    mis-contratos/page.tsx      ← Lista de contratos del usuario
    contrato/[address]/page.tsx ← Router de vistas (detecta rol)
  components/
    views/
      TenantView.tsx            ← Vista inquilino
      LandlordView.tsx          ← Vista propietario
      ArbitratorView.tsx        ← Vista árbitro
    ui/
      Button.tsx
      Badge.tsx
      Input.tsx
    Logo.tsx
    Nav.tsx
    Countdown.tsx
    SplitBar.tsx
    DataRow.tsx
  lib/
    contract.ts                 ← ABI + address + enums
    wagmi.ts                    ← Config wagmi + chain Fuji
    utils.ts                    ← Helpers de formato
    hooks/
      useEscrow.ts              ← Hook principal del contrato
  providers/
    Web3Provider.tsx
```

## Flujo

1. Inquilino conecta wallet → crea contrato en `/`
2. Ambas partes van a `/contrato/[address]`
3. La app detecta el rol (tenant/landlord/arbitrator) y muestra la vista correcta
4. Cada acción llama directamente al smart contract

## Red

Avalanche Fuji Testnet (chainId: 43113)
- Faucet: https://core.app/tools/testnet-faucet
- Explorer: https://testnet.snowtrace.io
