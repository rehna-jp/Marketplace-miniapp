import { expect } from "chai";
import { network } from "hardhat";

describe("Marketplace", function () {
  let escrow, marketplace, mockReputation, ethers;
  let deployer, seller, buyer, other;

  async function deployMockReputation(ethers) {
    const MockRep = await ethers.getContractFactory("MockReputation");
    const rep = await MockRep.deploy();
    await rep.waitForDeployment();
    return rep;
  }

  beforeEach(async function () {
    ({ ethers } = await network.connect());
    [deployer, seller, buyer, other] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    mockReputation = await deployMockReputation(ethers);

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(
      await escrow.getAddress(),
      await mockReputation.getAddress()
    );
    await marketplace.waitForDeployment();

    await escrow.setMarketplace(await marketplace.getAddress());
  });

  describe("listService", function () {
    it("creates a listing correctly", async function () {
      await marketplace
        .connect(seller)
        .listService("price-feed", ethers.parseEther("0.01"), 1);

      const listing = await marketplace.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.serviceType).to.equal("price-feed");
      expect(listing.price).to.equal(ethers.parseEther("0.01"));
      expect(listing.active).to.equal(true);
      expect(listing.sellerTokenId).to.equal(1);
    });

    it("increments listing count", async function () {
      await marketplace
        .connect(seller)
        .listService("price-feed", ethers.parseEther("0.01"), 1);
      await marketplace
        .connect(seller)
        .listService("content-gen", ethers.parseEther("0.02"), 2);

      expect(await marketplace.listingCount()).to.equal(2);
    });

    it("emits Listed event", async function () {
      await expect(
        marketplace
          .connect(seller)
          .listService("price-feed", ethers.parseEther("0.01"), 1)
      )
        .to.emit(marketplace, "Listed")
        .withArgs(1, seller.address, "price-feed", ethers.parseEther("0.01"));
    });
  });

  describe("placeOrder", function () {
    beforeEach(async function () {
      await marketplace
        .connect(seller)
        .listService("price-feed", ethers.parseEther("0.01"), 1);
    });

    it("places an order and locks funds in escrow", async function () {
      const price = ethers.parseEther("0.01");
      await marketplace.connect(buyer).placeOrder(1, 2, { value: price });

      const order = await marketplace.orders(1);
      expect(order.buyer).to.equal(buyer.address);
      expect(order.seller).to.equal(seller.address);
      expect(order.price).to.equal(price);
      expect(order.status).to.equal(1);

      const escrowBalance = await ethers.provider.getBalance(
        await escrow.getAddress()
      );
      expect(escrowBalance).to.equal(price);
    });

    it("rejects wrong payment amount", async function () {
      await expect(
        marketplace
          .connect(buyer)
          .placeOrder(1, 2, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Wrong payment amount");
    });

    it("rejects seller buying their own listing", async function () {
      await expect(
        marketplace
          .connect(seller)
          .placeOrder(1, 1, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Can't buy your own listing");
    });

    it("rejects inactive listing", async function () {
      await marketplace.connect(seller).deactivateListing(1);
      await expect(
        marketplace
          .connect(buyer)
          .placeOrder(1, 2, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Listing not active");
    });

    it("emits OrderPlaced event", async function () {
      const price = ethers.parseEther("0.01");
      const tx = await marketplace
        .connect(buyer)
        .placeOrder(1, 2, { value: price });
      await expect(tx).to.emit(marketplace, "OrderPlaced");
    });
  });

  describe("confirmDelivery", function () {
    beforeEach(async function () {
      await marketplace
        .connect(seller)
        .listService("price-feed", ethers.parseEther("0.01"), 1);
      await marketplace
        .connect(buyer)
        .placeOrder(1, 2, { value: ethers.parseEther("0.01") });
    });

    it("releases funds to seller on confirmation", async function () {
      const sellerBefore = await ethers.provider.getBalance(seller.address);
      await marketplace.connect(buyer).confirmDelivery(1, 5);
      const sellerAfter = await ethers.provider.getBalance(seller.address);

      expect(sellerAfter - sellerBefore).to.equal(ethers.parseEther("0.01"));
    });

    it("updates order status to Delivered", async function () {
      await marketplace.connect(buyer).confirmDelivery(1, 5);
      const order = await marketplace.orders(1);
      expect(order.status).to.equal(2);
    });

    it("rejects confirmation from non-buyer", async function () {
      await expect(
        marketplace.connect(other).confirmDelivery(1, 5)
      ).to.be.revertedWith("Only buyer can confirm");
    });

    it("rejects invalid score", async function () {
      await expect(
        marketplace.connect(buyer).confirmDelivery(1, 6)
      ).to.be.revertedWith("Score must be 1-5");
      await expect(
        marketplace.connect(buyer).confirmDelivery(1, 0)
      ).to.be.revertedWith("Score must be 1-5");
    });

    it("rejects double confirmation", async function () {
      await marketplace.connect(buyer).confirmDelivery(1, 5);
      await expect(
        marketplace.connect(buyer).confirmDelivery(1, 5)
      ).to.be.revertedWith("Wrong order status");
    });

    it("emits Delivered event", async function () {
      await expect(marketplace.connect(buyer).confirmDelivery(1, 5))
        .to.emit(marketplace, "Delivered")
        .withArgs(1);
    });
  });

  describe("claimRefund", function () {
  beforeEach(async function () {
    await marketplace
      .connect(seller)
      .listService("price-feed", ethers.parseEther("0.01"), 1);
    await marketplace
      .connect(buyer)
      .placeOrder(1, 2, { value: ethers.parseEther("0.01") });
  });

  it("refunds buyer after deadline", async function () {
    await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    const buyerBefore = await ethers.provider.getBalance(buyer.address);
    const tx = await marketplace.connect(buyer).claimRefund(1);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * tx.gasPrice;
    const buyerAfter = await ethers.provider.getBalance(buyer.address);

    expect(buyerAfter - buyerBefore + gasCost).to.equal(
      ethers.parseEther("0.01")
    );
  });

  it("rejects refund before deadline", async function () {
    await expect(
      marketplace.connect(buyer).claimRefund(1)
    ).to.be.revertedWith("Deadline not reached yet");
  });

  it("rejects refund from non-buyer", async function () {
    await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      marketplace.connect(other).claimRefund(1)
    ).to.be.revertedWith("Only buyer can claim refund");
  });

  it("rejects double refund", async function () {
    await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await marketplace.connect(buyer).claimRefund(1);
    await expect(
      marketplace.connect(buyer).claimRefund(1)
    ).to.be.revertedWith("Wrong order status");
  });
});

  describe("deactivateListing", function () {
    it("deactivates a listing", async function () {
      await marketplace
        .connect(seller)
        .listService("price-feed", ethers.parseEther("0.01"), 1);
      await marketplace.connect(seller).deactivateListing(1);

      const listing = await marketplace.listings(1);
      expect(listing.active).to.equal(false);
    });

    it("rejects deactivation from non-owner", async function () {
      await marketplace
        .connect(seller)
        .listService("price-feed", ethers.parseEther("0.01"), 1);
      await expect(
        marketplace.connect(other).deactivateListing(1)
      ).to.be.revertedWith("Not your listing");
    });
  });
});