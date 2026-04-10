// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrow {
    function lock(uint256 orderId, address seller, address buyer) external payable;
    function release(uint256 orderId) external;
    function refund(uint256 orderId) external;
}

interface IERC8004Reputation {
    function postFeedback(
        uint256 agentTokenId,
        uint8 score,
        string calldata tag
    ) external;
}

contract Marketplace {
    enum OrderStatus { Open, Matched, Delivered, Disputed, Settled }

    struct Listing {
        address seller;
        uint256 sellerTokenId;   // ERC-8004 token ID
        string serviceType;      // e.g. "price-feed", "content-gen"
        uint256 price;           // in wei
        bool active;
    }

    struct Order {
        uint256 listingId;
        address buyer;
        uint256 buyerTokenId;    // ERC-8004 token ID
        address seller;
        uint256 sellerTokenId;   // ERC-8004 token ID
        uint256 price;
        uint256 deadline;        // auto-refund after this timestamp
        OrderStatus status;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    uint256 public listingCount;
    uint256 public orderCount;

    IEscrow public escrow;
    IERC8004Reputation public reputation;

    event Listed(uint256 listingId, address seller, string serviceType, uint256 price);
    event OrderPlaced(uint256 orderId, address buyer, address seller, uint256 deadline);
    event Delivered(uint256 orderId);
    event Refunded(uint256 orderId);

    constructor(address _escrow, address _reputation) {
        escrow = IEscrow(_escrow);
        reputation = IERC8004Reputation(_reputation);
    }

    function listService(
        string calldata serviceType,
        uint256 price,
        uint256 tokenId
    ) external returns (uint256) {
        listingCount++;
        listings[listingCount] = Listing(
            msg.sender,
            tokenId,
            serviceType,
            price,
            true
        );
        emit Listed(listingCount, msg.sender, serviceType, price);
        return listingCount;
    }

    function placeOrder(
        uint256 listingId,
        uint256 buyerTokenId
    ) external payable returns (uint256) {
        Listing memory l = listings[listingId];
        require(l.active, "Listing not active");
        require(msg.value == l.price, "Wrong payment amount");
        require(msg.sender != l.seller, "Can't buy your own listing");

        orderCount++;
        uint256 deadline = block.timestamp + 24 hours;

        orders[orderCount] = Order(
            listingId,
            msg.sender,
            buyerTokenId,
            l.seller,
            l.sellerTokenId,
            l.price,
            deadline,
            OrderStatus.Matched
        );

        escrow.lock{value: msg.value}(orderCount, l.seller, msg.sender);

        emit OrderPlaced(orderCount, msg.sender, l.seller, deadline);
        return orderCount;
    }

    function confirmDelivery(uint256 orderId, uint8 score) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Only buyer can confirm");
        require(o.status == OrderStatus.Matched, "Wrong order status");
        require(score >= 1 && score <= 5, "Score must be 1-5");

        o.status = OrderStatus.Delivered;

        // Release funds to seller
        escrow.release(orderId);

        // Post reputation for seller on ERC-8004
        reputation.postFeedback(o.sellerTokenId, score, "delivery");

        emit Delivered(orderId);
    }

    function claimRefund(uint256 orderId) external {
        Order storage o = orders[orderId];
        require(msg.sender == o.buyer, "Only buyer can claim refund");
        require(o.status == OrderStatus.Matched, "Wrong order status");
        require(block.timestamp > o.deadline, "Deadline not reached yet");

        o.status = OrderStatus.Disputed;

        // Return funds to buyer
        escrow.refund(orderId);

        // Post negative reputation for seller on ERC-8004
        reputation.postFeedback(o.sellerTokenId, 1, "timeout");

        emit Refunded(orderId);
    }

    function deactivateListing(uint256 listingId) external {
        require(listings[listingId].seller == msg.sender, "Not your listing");
        listings[listingId].active = false;
    }
}