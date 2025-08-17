# Google Analytics Setup for Streammate

## 🚀 Getting Started

### Step 1: Create Google Analytics 4 Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click "Start measuring"
3. Create a new account (or use existing)
4. Create a new property for "Streammate"
5. Choose your timezone and currency
6. **Copy your Measurement ID** (looks like `G-XXXXXXXXXX`)

### Step 2: Update Your Tracking Code

Replace `G-XXXXXXXXXX` in `index.html` with your actual Measurement ID:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX"); <!-- Replace this with your ID -->
</script>
```

### Step 3: Deploy and Test

1. Deploy your app with the updated tracking code
2. Visit your website
3. Check Google Analytics Real-Time reports to see data coming in

## 📊 Events Being Tracked

### Automatic Events

- **Page Views**: Every page visit is automatically tracked
- **User Sessions**: Session duration, bounce rate, etc.

### Custom Events

- **Room Created**: `room_created` with content type
- **User Joined Room**: `user_joined_room` with room code and content type
- **Match Found**: `match_found` with show ID and matched users count
- **Swipe Made**: `swipe_made` with direction and content type
- **User Left Room**: `user_left_room` with room code and content type
- **Errors**: `error_occurred` with error type and message

## 📈 Key Metrics You Can Track

### Room Analytics

- Total rooms created per day/week/month
- Rooms by content type (Movies vs TV Shows)
- Average users per room
- Room creation trends

### User Engagement

- Total unique visitors
- Session duration
- Pages per session
- User retention

### Match Analytics

- Total matches found
- Matches by content type
- Match frequency trends
- Most popular shows for matches

### Swipe Behavior

- Total swipes made
- Swipe direction distribution (left vs right)
- Swipes by content type
- User engagement patterns

## 🔍 Viewing Your Data

### Real-Time Reports

- **Real-time > Overview**: See current active users
- **Real-time > Events**: See events happening right now

### Standard Reports

- **Reports > Engagement > Events**: View all custom events
- **Reports > Engagement > Pages and screens**: Page view data
- **Reports > User**: User demographics and behavior

### Custom Reports

- **Explore**: Create custom reports and funnels
- **Custom Reports**: Build dashboards for specific metrics

## 🛠️ Customization

### Adding New Events

Use the `trackCustomEvent` function in `src/lib/analytics.ts`:

```typescript
import { trackCustomEvent } from "@/lib/analytics";

// Track any custom event
trackCustomEvent("show_details_viewed", {
  show_id: "12345",
  content_type: "movies",
  user_action: "clicked_info_button",
});
```

### Modifying Event Parameters

Edit the analytics functions in `src/lib/analytics.ts` to add/remove parameters:

```typescript
export const trackRoomCreated = (
  contentType: "movies" | "tv",
  roomCode?: string
) => {
  if (isGAReady()) {
    window.gtag("event", "room_created", {
      content_type: contentType,
      room_code: roomCode, // New parameter
      event_category: "room",
      event_label: "room_creation",
    });
  }
};
```

## 🚨 Troubleshooting

### No Data Appearing

1. Check browser console for JavaScript errors
2. Verify Measurement ID is correct
3. Ensure tracking code is in `<head>` section
4. Check if ad blockers are blocking analytics

### Events Not Tracking

1. Verify `gtag` function exists: `console.log(window.gtag)`
2. Check browser network tab for analytics requests
3. Ensure analytics functions are being called

### Privacy Considerations

- Google Analytics respects user privacy settings
- Users can opt out via browser extensions
- Consider adding a privacy policy mentioning analytics usage

## 📱 Mobile App Analytics

If you build a mobile app later, Google Analytics 4 supports:

- Cross-platform tracking (web + mobile)
- App-specific metrics
- User journey across devices

## 🎯 Next Steps

1. **Set up Goals**: Create conversion goals in GA4
2. **Audience Segments**: Segment users by behavior
3. **Custom Dashboards**: Build dashboards for key metrics
4. **Alerts**: Set up alerts for important events
5. **Integration**: Connect with other tools (Google Ads, Search Console)

## 📞 Support

- [Google Analytics Help Center](https://support.google.com/analytics)
- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Analytics Community](https://support.google.com/analytics/community)

---

**Note**: This setup provides comprehensive tracking for your Streammate app. You'll be able to answer questions like "How many rooms were created today?" and "How many users visited the website?" with real data from Google Analytics.
