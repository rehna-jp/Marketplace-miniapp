// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    struct Payment {
        address seller;
        address buyer;
        uint256 amount;
        bool released;
    }

    mapping(uint256 => Payment) public payments;
    address public marketplace;

    event Locked(uint256 orderId, address seller, uint256 amount);
    event Released(uint256 orderId, address seller, uint256 amount);
    event Refunded(uint256 orderId, address buyer, uint256 amount);

    constructor() {
        marketplace = msg.sender;
    }

    function setMarketplace(address _marketplace) external {
        require(msg.sender == marketplace, "Unauthorized");
        marketplace = _marketplace;
    }

    function lock(uint256 orderId, address seller, address buyer) external payable {
        require(msg.sender == marketplace, "Unauthorized");
        require(payments[orderId].amount == 0, "Order already exists");
        payments[orderId] = Payment(seller, buyer, msg.value, false);
        emit Locked(orderId, seller, msg.value);
    }

    function release(uint256 orderId) external {
        require(msg.sender == marketplace, "Unauthorized");
        Payment storage p = payments[orderId];
        require(!p.released, "Already released");
        p.released = true;
        payable(p.seller).transfer(p.amount);
        emit Released(orderId, p.seller, p.amount);
    }

    function refund(uint256 orderId) external {
        require(msg.sender == marketplace, "Unauthorized");
        Payment storage p = payments[orderId];
        require(!p.released, "Already released");
        p.released = true;
        payable(p.buyer).transfer(p.amount);
        emit Refunded(orderId, p.buyer, p.amount);
    }
}