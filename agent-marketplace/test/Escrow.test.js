import { expect } from "chai";
import { network } from "hardhat";

describe("Escrow", function () {
  let escrow, ethers;
  let marketplace, seller, buyer, other;

  beforeEach(async function () {
    ({ ethers } = await network.connect());
    [marketplace, seller, buyer, other] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.connect(marketplace).deploy();
    await escrow.waitForDeployment();
  });

  describe("setMarketplace", function () {
    it("allows owner to update marketplace address", async function () {
      await escrow.setMarketplace(other.address);
      expect(await escrow.marketplace()).to.equal(other.address);
    });

    it("rejects non-owner from updating marketplace", async function () {
      await expect(
        escrow.connect(other).setMarketplace(other.address)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("lock", function () {
    it("locks funds correctly", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });

      const payment = await escrow.payments(1);
      expect(payment.seller).to.equal(seller.address);
      expect(payment.buyer).to.equal(buyer.address);
      expect(payment.amount).to.equal(amount);
      expect(payment.released).to.equal(false);
    });

    it("rejects lock from non-marketplace", async function () {
      const amount = ethers.parseEther("0.01");
      await expect(
        escrow.connect(other).lock(1, seller.address, buyer.address, { value: amount })
      ).to.be.revertedWith("Unauthorized");
    });

    it("rejects duplicate order ID", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });
      await expect(
        escrow.lock(1, seller.address, buyer.address, { value: amount })
      ).to.be.revertedWith("Order already exists");
    });
  });

  describe("release", function () {
    it("releases funds to seller", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });

      const sellerBefore = await ethers.provider.getBalance(seller.address);
      await escrow.release(1);
      const sellerAfter = await ethers.provider.getBalance(seller.address);

      expect(sellerAfter - sellerBefore).to.equal(amount);
    });

    it("rejects double release", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });
      await escrow.release(1);

      await expect(escrow.release(1)).to.be.revertedWith("Already released");
    });

    it("rejects release from non-marketplace", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });

      await expect(
        escrow.connect(other).release(1)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("refund", function () {
    it("refunds funds to buyer", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });

      const buyerBefore = await ethers.provider.getBalance(buyer.address);
      await escrow.refund(1);
      const buyerAfter = await ethers.provider.getBalance(buyer.address);

      expect(buyerAfter - buyerBefore).to.equal(amount);
    });

    it("rejects double refund", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });
      await escrow.refund(1);

      await expect(escrow.refund(1)).to.be.revertedWith("Already released");
    });

    it("rejects refund from non-marketplace", async function () {
      const amount = ethers.parseEther("0.01");
      await escrow.lock(1, seller.address, buyer.address, { value: amount });

      await expect(
        escrow.connect(other).refund(1)
      ).to.be.revertedWith("Unauthorized");
    });
  });
});