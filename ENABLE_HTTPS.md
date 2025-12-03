# Enable HTTPS for Production

## Current Issue

Your app is experiencing a "Mixed Content" error:
- **Frontend**: HTTPS (CloudFront)
- **Backend**: HTTP (ALB)
- **Problem**: Browsers block HTTP requests from HTTPS pages

## Immediate Solution

**Use the HTTP S3 website endpoint:**
```
http://live-quiz-frontend-333105300941.s3-website-us-east-1.amazonaws.com
```

This works because both frontend and backend are on HTTP.

---

## Production Solution: Enable HTTPS on ALB

### Step 1: Request SSL Certificate

```bash
# Request a certificate in AWS Certificate Manager
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS \
  --region us-east-1
```

Or use a wildcard certificate:
```bash
aws acm request-certificate \
  --domain-name "*.your-domain.com" \
  --subject-alternative-names "your-domain.com" \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Validate Certificate

1. Go to AWS Certificate Manager console
2. Click on the certificate
3. Add the CNAME records to your DNS (Route 53 or your DNS provider)
4. Wait for validation (usually 5-30 minutes)

### Step 3: Add HTTPS Listener to ALB

```bash
# Get your certificate ARN
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[0].CertificateArn' --output text)

# Get your ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers --names live-quiz-alb --region us-east-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Get your target group ARN
TG_ARN=$(aws elbv2 describe-target-groups --names websocket-tg --region us-east-1 --query 'TargetGroups[0].TargetGroupArn' --output text)

# Add HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region us-east-1
```

### Step 4: Update Frontend Environment

```bash
cd frontend

# Update environment variables
cat > .env.production << EOF
VITE_API_URL=https://your-domain.com/api
VITE_WEBSOCKET_URL=https://your-domain.com
EOF

# Rebuild
npm run build:prod

# Deploy
aws s3 sync dist/ s3://live-quiz-frontend-333105300941/ --region us-east-1
aws cloudfront create-invalidation --distribution-id E14OG9R972IV2 --paths "/*"
```

### Step 5: Set Up Custom Domain (Optional)

1. **Create Route 53 hosted zone** (if using Route 53)
2. **Add A record** pointing to ALB:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id YOUR_ZONE_ID \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "api.your-domain.com",
           "Type": "A",
           "AliasTarget": {
             "HostedZoneId": "ALB_HOSTED_ZONE_ID",
             "DNSName": "live-quiz-alb-1251647200.us-east-1.elb.amazonaws.com",
             "EvaluateTargetHealth": false
           }
         }
       }]
     }'
   ```

3. **Add CNAME for CloudFront**:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id YOUR_ZONE_ID \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "app.your-domain.com",
           "Type": "CNAME",
           "TTL": 300,
           "ResourceRecords": [{"Value": "dch9ml2nwvrkt.cloudfront.net"}]
         }
       }]
     }'
   ```

---

## Alternative: Use CloudFront for Backend Too

Instead of exposing the ALB directly, you can put CloudFront in front of it:

### Benefits:
- SSL/TLS termination at CloudFront
- Better global performance
- DDoS protection
- No need for ALB HTTPS listener

### Steps:

1. **Create CloudFront distribution for backend**:
   - Origin: ALB DNS name (HTTP)
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE

2. **Update frontend to use CloudFront URL**:
   ```
   VITE_API_URL=https://api-distribution.cloudfront.net/api
   VITE_WEBSOCKET_URL=https://api-distribution.cloudfront.net
   ```

---

## Quick CDK Update (Recommended)

Update your CDK stack to include HTTPS:

```typescript
// In infrastructure/lib/live-quiz-event-stack.ts

// Add certificate (you need to create it first in ACM)
const certificate = acm.Certificate.fromCertificateArn(
  this,
  'Certificate',
  'arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID'
);

// Add HTTPS listener
alb.addListener('HTTPSListener', {
  port: 443,
  protocol: elbv2.ApplicationProtocol.HTTPS,
  certificates: [certificate],
  defaultAction: elbv2.ListenerAction.forward([targetGroup]),
});

// Redirect HTTP to HTTPS
httpListener.addAction('RedirectToHTTPS', {
  action: elbv2.ListenerAction.redirect({
    protocol: 'HTTPS',
    port: '443',
    permanent: true,
  }),
});
```

Then redeploy:
```bash
cd infrastructure
npx cdk deploy
```

---

## Current Working URLs

**Frontend (HTTP - works now):**
```
http://live-quiz-frontend-333105300941.s3-website-us-east-1.amazonaws.com
```

**Frontend (HTTPS - has mixed content issue):**
```
https://dch9ml2nwvrkt.cloudfront.net
```

**Backend (HTTP only):**
```
http://live-quiz-alb-1251647200.us-east-1.elb.amazonaws.com
```

---

## Summary

**For immediate testing:** Use the HTTP S3 website URL

**For production:** 
1. Get an SSL certificate from ACM
2. Add HTTPS listener to ALB
3. Update frontend environment variables
4. Rebuild and redeploy frontend

**Best practice:**
- Use custom domain with Route 53
- Enable HTTPS on both frontend and backend
- Consider CloudFront for backend too
- Enable WAF for security
