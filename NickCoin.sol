// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./INickCoin.sol";

contract NickCoin is ERC20, Ownable {
    // Price of one NicksCoin
    uint256 public constant tokenPrice = 0.001 ether;
    //Each NFT will give each owner 50 tokens
    uint256 public constant tokensPerNFT = 50 * 10**18;

    uint256 public constant maxTotalSupply = 10000 * 10**18;
    //NickCoin Contract Instance
    INickCoin NickCoinNFT;
    //A mapping to keep track of which tokenIds have been claimed 
    mapping (uint256 => bool) public tokenIdsClaimed;

    constructor(address _nickCoinContract) ERC20("NickCoin", "NC") {
        NickCoinNFT = INickCoin(_nickCoinContract);
    }

    /**
       * @dev Mints `amount` number of NickCoinTokens
       * Requirements:
       * - `msg.value` should be equal or greater than the tokenPrice * amount
       */
    
    function mint(uint256 amount) public payable {
        // The value of ether that should be equal or greater than tokenPrice * amount;
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ether sent is incorrect");
        //total tokens + amount <= 10000, otherwise revert the transaction
        uint256 amountWithDecimals = amount * 10**18;
        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
             "Exceeds the max total supply available."
        );
        // this calls the internal function from openZeppelin ERC20 Contract
        _mint(msg.sender, amountWithDecimals);
    }

     /**
       * @dev Mints tokens based on the number of NFT's held by the sender
       * Requirements:
       * balance of Crypto Dev NFT's owned by the sender should be greater than 0
       * Tokens should have not been claimed for all the NFTs owned by the sender
       */
    function claim() public {
        address sender = msg.sender;
        //The number of NFT's held by a given sender address 
        uint256 balance = NickCoinNFT.balanceOf(sender);
        // If the balance is zero, revert transaction
        require(balance > 0, "You dont own any NFT's from NFTCollection");
        uint256 amount = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = NickCoinNFT.tokenOfOwnerByIndex(sender, i);
            // if tokenId has not been claimed, increase the amount
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }

        //if all the token Ids have been claimed, revert transaction
        require(amount > 0, "You have already claimed all the tokens");
        // Call internal function from openzeppelin erc20 contract
        // Mint (amount * 50) tokens for each NFT
        _mint(msg.sender, amount * tokensPerNFT);
    }

    // Function to receive Ether. msg.data must be empty'
    receive() external payable{}
    //fallback function called when msg.data is empty  
    fallback() external payable{}
}