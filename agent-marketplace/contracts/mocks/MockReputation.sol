// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Stands in for the real ERC-8004 Reputation Registry during testing
contract MockReputation {
    struct Feedback {
        uint256 agentTokenId;
        uint8 score;
        string tag;
    }

    Feedback[] public feedbacks;

    function postFeedback(
        uint256 agentTokenId,
        uint8 score,
        string calldata tag
    ) external {
        feedbacks.push(Feedback(agentTokenId, score, tag));
    }

    function getFeedbackCount() external view returns (uint256) {
        return feedbacks.length;
    }
}