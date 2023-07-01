![DMOL](https://user-images.githubusercontent.com/37007079/250253634-16814992-9298-4c08-89a3-078dba3a6b52.png#gh-dark-mode-only)
![LMOL](https://user-images.githubusercontent.com/37007079/250253177-b1c52b1b-1fe1-4216-9057-814b45613077.png#gh-light-mode-only)

### `OpenPOS`
OpenPOS is an open source visual Point of Sale system built on [`open-stock`](https://github.com/bennjii/open-stock), it is completely free to host yourself, and is updated frequently. [This](https://medium.com/today-i-solved/how-to-deploy-next-js-on-aws-ec2-with-ssl-https-7980ec6fe8d3) guide may be of assistance when deploying a dockerized version of open-stock.

> **`BETA`** OpenPOS is in beta. This means, the sofware **is not stable**. Do not rely on it in any critical mannor for your business. 

### Mission
OpenPOS is the completely open-source visual POS system. It was initially created in conjunction with the backend management system [`open-stock`](https://github.com/bennjii/open-stock) to develop a proof of concept for the viability and usability of its system, but has since proven this possibility and aims to become its own viable product once significant headway can be reached in terms of implementing the following features:

# Current Visual Feature Implementations
| Feature Name | Implemented | Notes |
|--------------|-----------|-----------|
| Products  | ✅ | Search for your Products |
| Customers  | ✅ | Create, Search, Modify and Interact with your customer data |
| Transactions  | ✅ | Create instore transactions |
| Order Shipping and Pickup  | ✅ | Create shipments or pickups for your other stores right from your kiosk |
| Online Order Managment | ⚠️ | View, work through and complete outgoing online shipments or orders |
| Inventory  | 🚧 | Modify, View and monitor your inventory |
| Jobs  | ❌ | Create, edit, modify and manage Jobs for your business, from appointments to workshop tasks. |
| Payment Processing | ❌ | Workflow Blocked - Currently not yet implemented, on the roadmap. |
| Receipt Printing | ❌ | Workflow Blocked - Currently not yet implemented, on the roadmap. |
| Back of House Products | ❌ | Workflow Blocked - Currently not yet implemented, on the roadmap. |

*Key:* \
✅: Work 99% Completed. \
⚠️: Work in progress, not yet finalised. \
🚧: On the Burner, Will be implemented soon. \
❌: Workflow Blocked by open-stock implementation

### FAQ
- **I have existing data, can I move it or do I have to start from scratch.**
  
    *We try our best to make the migration easy, so we created [`migrator`](https://github.com/bennjii/migrator).
  It doesn't support every data format yet, but keep an eye on the repository for updates, or submit a feature request according to [this](https://github.com/bennjii/open-stock#migrating-information) and we'll put it on the list.*

- **Why would I choose OpenPOS over another system?**

    *This software is developed and given as-is, allowing you, the user, to read line of code that would run your store. As a developer, you could extend this functionality to best fit your store without needing to build the entire system yourself. Furthermore, the software is free to use, although similarly does not assume liability for the misuse or complete reliance on the sofware.* 

