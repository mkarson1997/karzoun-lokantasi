# Karzoun Restaurant Web App

A multi-page restaurant web experience covering menu discovery, ordering, account flows, customer profiles, informational pages and basic legal content.

This repository demonstrates how a small business website can be organized as a coherent customer journey rather than a single static landing page.

## Product flow

```text
Discover restaurant
      │
      ▼
Browse menu
      │
      ▼
Create / access account
      │
      ▼
Place an order
      │
      ▼
Review order / profile information
```

## Main pages

- `index.html` - landing page
- `menu.html` - menu discovery
- `order.html` - order flow
- `orders.html` - order history / overview
- `login.html` - sign in
- `register.html` - account creation
- `profile.html` - customer profile
- `contact.html` - contact information
- `about.html` - restaurant information
- `gizlilik.html` - privacy page
- `kosullar.html` - terms page

## Engineering focus

The project demonstrates:

- multi-page information architecture,
- customer-oriented navigation,
- reusable visual patterns,
- responsive layouts,
- forms and account-oriented flows,
- structuring a business site around a conversion journey,
- static deployment compatibility.

## Tech stack

- HTML5
- CSS3
- Bootstrap
- Flexbox
- JavaScript

## Run locally

Clone the repository and serve it through a local static server.

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Roadmap

- Add a real backend API for orders and accounts
- Add persistent database storage
- Add server-side authentication and authorization
- Add form validation and automated UI tests
- Add accessibility checks
- Add order-state management and payment-provider abstraction
- Add a Docker-based full-stack development setup

## Portfolio note

This is a front-end product-flow project. It is intentionally separated from my backend-focused repositories such as [CargoAPI](https://github.com/mkarson1997/CargoAPI) and my secure inventory project [Abeer Inventory](https://github.com/mkarson1997/abeer-inventory-1.0.0).

---

Built by [Mahmoud Karzoun](https://github.com/mkarson1997).