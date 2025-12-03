#!/bin/bash

echo "Checking AWS deployment status..."
echo ""

STATUS=$(aws cloudformation describe-stacks --stack-name LiveQuizEventStack --region us-east-1 --query 'Stacks[0].StackStatus' --output text 2>&1)

echo "Current Status: $STATUS"
echo ""

if [[ "$STATUS" == "CREATE_COMPLETE" ]]; then
    echo "✅ Deployment Complete!"
    echo ""
    echo "=== Stack Outputs ==="
    aws cloudformation describe-stacks \
        --stack-name LiveQuizEventStack \
        --region us-east-1 \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
elif [[ "$STATUS" == "CREATE_IN_PROGRESS" ]]; then
    echo "⏳ Deployment still in progress..."
    echo ""
    echo "Latest events:"
    aws cloudformation describe-stack-events \
        --stack-name LiveQuizEventStack \
        --region us-east-1 \
        --max-items 3 \
        --query 'StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId]' \
        --output table
else
    echo "Status: $STATUS"
fi
