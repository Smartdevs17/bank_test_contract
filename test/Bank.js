const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");


describe("Bank", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearBankFixture() {

    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();

    return { bank };
  }

  describe("Deployment", function () {
    it("Should deploy the contract successfully", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      console.log(bank);
      expect(bank.address).to.be.properAddress;
    });
  });

  describe("Account Creation", function () {
    it("Should create a new account", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      const [owner] = await ethers.getSigners();
      
      await expect(bank.createAccount())
        .to.emit(bank, "AccountCreated")
        .withArgs(owner.address);
    });

    it("Should not allow creating an account twice", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      const [owner] = await ethers.getSigners();
      
      console.log('Balance before first createAccount:', await bank.getBalance());
      await bank.createAccount({ from: owner.address });
      console.log('Balance after first createAccount:', await bank.getBalance());
      
      await expect(bank.createAccount({ from: owner.address })).to.be.revertedWith('Account already exists');
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      const [owner] = await ethers.getSigners();
      const depositAmount = ethers.parseEther("1");

      await bank.createAccount();
      await expect(bank.deposit({ value: depositAmount }))
        .to.emit(bank, "Deposit")
        .withArgs(owner.address, depositAmount);

      expect(await bank.getBalance()).to.equal(depositAmount);
    });

    it("Should not allow zero deposits", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      
      await bank.createAccount();
      await expect(bank.deposit({ value: 0 })).to.be.revertedWith("Deposit amount must be greater than 0");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawals", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      const [owner] = await ethers.getSigners();
      const depositAmount = ethers.parseEther("1");
      const withdrawAmount = ethers.parseEther("0.5");

      await bank.createAccount();
      await bank.deposit({ value: depositAmount });

      await expect(bank.withdraw(withdrawAmount))
        .to.emit(bank, "Withdrawal")
        .withArgs(owner.address, withdrawAmount);

      expect(await bank.getBalance()).to.equal(depositAmount - withdrawAmount);
    });

    it("Should not allow withdrawals exceeding balance", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      const depositAmount = ethers.parseEther("1");

      await bank.createAccount();
      await bank.deposit({ value: depositAmount });

      await expect(bank.withdraw(depositAmount + 1n)).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Balance Check", function () {
    it("Should return correct balance", async function () {
      const { bank } = await loadFixture(deployOneYearBankFixture);
      const depositAmount = ethers.parseEther("1");

      await bank.createAccount();
      await bank.deposit({ value: depositAmount });

      expect(await bank.getBalance()).to.equal(depositAmount);
    });
  });

});