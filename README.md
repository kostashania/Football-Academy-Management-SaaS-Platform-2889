# ⚽ Football SaaS Platform

A comprehensive multi-tenant SaaS platform for football clubs and academies to manage player-related data, performance tracking, training sessions, matches, and more.

## 🏗️ Architecture

### Multi-Tenant Database Design
- **Shared Schema**: `plrs_SAAS` for global data (tenant users, global ads, subscriptions)
- **Tenant Schemas**: `club01_`, `club02_`, etc. for club-specific data
- **Row Level Security (RLS)**: Enabled on all tables with proper access policies
- **Supabase Authentication**: Integration with `auth.uid()` for secure access control

### Technology Stack
- **Frontend**: React 18 + Vite
- **UI Framework**: Tailwind CSS
- **Icons**: React Icons (Feather Icons)
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM (Hash Router)
- **State Management**: React Context API
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 👥 User Roles & Permissions

### Superadmin
- Manages tenants and global advertisements
- Oversees subscriptions and billing
- Access to global analytics and reports

### Tenant Admin
- Full access to their club's data
- Manages users, players, and club settings
- Creates tenant-specific advertisements
- Generates reports and analytics

### Trainer
- Evaluates players during training and matches
- Views player profiles and performance data
- Creates training reports and assessments

### Training Supervisor
- Marks attendance for training sessions
- Views player health information
- Manages training schedules

### Match Supervisor
- Inputs match statistics (goals, assists, cards)
- Records player positions and performance
- Generates match reports

### User (Board Member)
- View-only access to reports and analytics
- Can view player profiles and statistics

### Player
- Self-access to personal profile
- View own performance data and documents
- Access to training and match schedules

## 🗂️ Database Schema

### Shared Schema (plrs_SAAS)
- `tenant_users` - User-tenant role mapping
- `ads_global` - Global advertisements
- `ads_tenant` - Tenant-specific advertisements
- `subscriptions` - Subscription management

### Tenant Schema (club01_, club02_, etc.)
- `players` - Player profiles and information
- `positions` - Football positions (GK, DEF, MID, FWD)
- `trainings` - Training sessions
- `attendance` - Training attendance tracking
- `training_characteristics` - Evaluation criteria for training
- `match_characteristics` - Evaluation criteria for matches
- `player_evaluations` - Player performance evaluations
- `matches` - Match information
- `match_stats` - Player match statistics
- `documents` - Player document management
- `audit_logs` - Change tracking and auditing

## 🚀 Features

### Player Management
- Comprehensive player profiles with personal information
- Document management (EPO records, health cards, etc.)
- Position tracking and management
- Photo uploads and profile images

### Training Management
- Training session scheduling and tracking
- Attendance marking with status (present/absent/injured)
- Player evaluations with customizable characteristics
- Performance scoring (1-10 scale)

### Match Management
- Match scheduling and opponent tracking
- Detailed match statistics (goals, assists, cards, minutes)
- Player position tracking for each match
- Match reports and analysis

### Performance Analytics
- Player performance tracking over time
- Training attendance analytics
- Match statistics and trends
- Exportable reports (CSV/PDF)

### Document Management
- Secure document storage and retrieval
- Expiry date tracking and notifications
- Document type categorization
- Access control based on user roles

### Notification System
- Automated alerts for expiring documents
- Training and match reminders
- Performance milestone notifications
- Custom notification preferences

### Advertisement System
- Global advertisements (managed by superadmin)
- Tenant-specific advertisements
- Scheduled ad campaigns
- Click tracking and analytics

## 🔐 Security Features

### Row Level Security (RLS)
- All tables protected with RLS policies
- User access scoped by tenant and role
- Automatic data isolation between tenants

### Authentication & Authorization
- Secure user authentication via Supabase
- Role-based access control (RBAC)
- JWT token-based session management
- Password policies and security

### Data Protection
- Encrypted data storage
- Secure file uploads
- Audit logging for all changes
- GDPR compliance features

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interfaces
- Responsive navigation
- Optimized for tablets and smartphones

## 🎨 UI/UX Features

- Modern, clean interface design
- Smooth animations and transitions
- Intuitive navigation patterns
- Consistent design language
- Accessibility compliance

## 📊 Reporting & Analytics

- Player performance reports
- Training attendance analytics
- Match statistics and trends
- Custom date range filtering
- Export functionality (PDF/CSV)

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server: `npm run dev`

## 🏃‍♂️ Getting Started

1. **Setup Database**: Run the SQL schema file to create the database structure
2. **Create Tenant**: Use the `create_tenant_schema()` function to create new club schemas
3. **Add Users**: Insert users into the `tenant_users` table with appropriate roles
4. **Configure Subscriptions**: Set up subscription packages for tenants
5. **Start Managing**: Begin adding players, scheduling training, and tracking performance

## 📈 Scalability

- Multi-tenant architecture supports unlimited clubs
- Efficient database design with proper indexing
- Horizontal scaling capabilities
- CDN integration for file storage
- Caching strategies for performance

## 🔮 Future Enhancements

- Mobile app (React Native)
- Real-time notifications
- Advanced analytics with ML
- Integration with wearable devices
- Video analysis capabilities
- Social features for players
- Tournament management
- Financial management module

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.