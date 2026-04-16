/**
 * Premium Dashboard Example
 * ────────────────────────────────────
 * Complete example showcasing all premium components and animations
 * Copy and adapt this for your own pages!
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  Download,
} from 'lucide-react'
import {
  PremiumButton,
  PremiumCard,
  PremiumCardBody,
  PremiumCardHeader,
  KPICard,
  FeatureCard,
  PremiumBadge,
  BadgeGroup,
  LoadingSkeleton,
  pageVariants,
  containerVariants,
  itemVariants,
  gridItemVariants,
} from '@/components/Premium'

export default function PremiumDashboardExample() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/10 to-purple-50/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-6 md:p-8"
    >
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <motion.div variants={itemVariants} className="mb-8">
        <motion.h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient-primary">
          Premium Dashboard
        </motion.h1>
        <motion.p variants={itemVariants} className="text-gray-600 dark:text-slate-400 text-lg">
          Experience a modern, high-end SaaS interface
        </motion.p>
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STATUS BADGES */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <motion.div variants={itemVariants} className="mb-8">
        <BadgeGroup
          badges={[
            { label: 'Live', variant: 'success', glow: true },
            { label: 'Performance: 98%', variant: 'primary', glow: true },
            { label: 'Last Update: 2 min ago', variant: 'info' },
          ]}
          size="lg"
        />
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* KPI CARDS GRID */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={gridItemVariants}>
          <KPICard
            title="Total Revenue"
            value={54230.50}
            change={12.5}
            changeLabel="vs last month"
            icon={DollarSign}
            gradient="from-primary-500 to-primary-600"
            decimals={2}
            prefix="$"
          />
        </motion.div>

        <motion.div variants={gridItemVariants}>
          <KPICard
            title="Total Orders"
            value={1234}
            change={8.2}
            changeLabel="vs last month"
            icon={ShoppingCart}
            gradient="from-accent-500 to-accent-600"
            accentColor="accent"
          />
        </motion.div>

        <motion.div variants={gridItemVariants}>
          <KPICard
            title="Page Views"
            value={89456}
            change={-3.1}
            changeLabel="vs last month"
            icon={Eye}
            gradient="from-info-500 to-info-600"
            accentColor="info"
            format={(val) => (val / 1000).toFixed(1) + 'K'}
          />
        </motion.div>

        <motion.div variants={gridItemVariants}>
          <KPICard
            title="Active Users"
            value={456}
            change={5.7}
            changeLabel="vs last month"
            icon={Users}
            gradient="from-success-500 to-success-600"
            accentColor="success"
          />
        </motion.div>
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT AREA - TWO COLUMN */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Charts & Analytics */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 space-y-6"
        >
          {/* Revenue Chart Card */}
          <PremiumCard variant="glass" glow glowColor="primary">
            <PremiumCardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Revenue Overview
                </h3>
                <PremiumButton
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  isIconOnly
                />
              </div>
            </PremiumCardHeader>
            <PremiumCardBody>
              {/* Placeholder for chart - replace with actual chart */}
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: '20px' }}
                      animate={{ height: `${20 + Math.random() * 80}px` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="bg-gradient-to-t from-primary-500 to-primary-600 rounded-lg"
                    />
                  ))}
                </div>
                <div className="h-32 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-800 dark:to-slate-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-slate-400">Chart will go here</p>
                </div>
              </div>
            </PremiumCardBody>
          </PremiumCard>

          {/* Performance Metrics */}
          <PremiumCard variant="gradient">
            <PremiumCardHeader>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Performance Metrics
              </h3>
            </PremiumCardHeader>
            <PremiumCardBody>
              <div className="space-y-6">
                {[
                  { label: 'Conversion Rate', value: '3.24%', change: 0.5 },
                  { label: 'Bounce Rate', value: '42.1%', change: -1.2 },
                  { label: 'Avg Session Duration', value: '4m 32s', change: 12.3 },
                ].map((metric, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="flex items-center justify-between pb-4 last:pb-0 border-b border-gray-200 dark:border-slate-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {metric.value}
                      </p>
                    </div>
                    <motion.div
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        metric.change >= 0
                          ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                          : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
                      }`}
                    >
                      <span>{metric.change > 0 ? '↑' : '↓'}</span>
                      <span>{Math.abs(metric.change)}%</span>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </PremiumCardBody>
          </PremiumCard>
        </motion.div>

        {/* Right Column - Quick Actions & Insights */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Quick Actions */}
          <PremiumCard variant="premium">
            <PremiumCardHeader>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
            </PremiumCardHeader>
            <PremiumCardBody>
              <div className="space-y-3">
                <PremiumButton
                  variant="primary"
                  className="w-full"
                  icon={ShoppingCart}
                >
                  New Order
                </PremiumButton>
                <PremiumButton
                  variant="secondary"
                  className="w-full"
                  icon={Users}
                >
                  Add Customer
                </PremiumButton>
                <PremiumButton
                  variant="ghost"
                  className="w-full"
                  icon={BarChart3}
                >
                  View Reports
                </PremiumButton>
              </div>
            </PremiumCardBody>
          </PremiumCard>

          {/* Insights */}
          <PremiumCard variant="glass">
            <PremiumCardHeader>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Key Insights
              </h3>
            </PremiumCardHeader>
            <PremiumCardBody>
              <div className="space-y-4 text-sm">
                <motion.div
                  variants={itemVariants}
                  className="p-3 rounded-lg bg-success-100/50 dark:bg-success-900/20 border border-success-200 dark:border-success-800"
                >
                  <p className="text-success-900 dark:text-success-100">
                    📈 Revenue increased by <span className="font-bold">12.5%</span> this month
                  </p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="p-3 rounded-lg bg-warning-100/50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                >
                  <p className="text-warning-900 dark:text-warning-100">
                    ⚠️ 5 products are below reorder level
                  </p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="p-3 rounded-lg bg-info-100/50 dark:bg-info-900/20 border border-info-200 dark:border-info-800"
                >
                  <p className="text-info-900 dark:text-info-100">
                    ℹ️ Next inventory pickup is in 3 days
                  </p>
                </motion.div>
              </div>
            </PremiumCardBody>
          </PremiumCard>
        </motion.div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* FEATURE CARDS */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Platform Features
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: 'Real-time Analytics',
              description: 'Track all your metrics in real-time with live updates',
              icon: BarChart3,
              accent: 'primary',
            },
            {
              title: 'Smart Predictions',
              description: 'AI-powered insights for better decision making',
              icon: TrendingUp,
              accent: 'accent',
            },
            {
              title: 'Team Collaboration',
              description: 'Work together seamlessly with your team',
              icon: Users,
              accent: 'success',
            },
          ].map((feature, idx) => (
            <motion.div key={idx} variants={gridItemVariants}>
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* CALL TO ACTION */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <motion.div
        variants={itemVariants}
        className="rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 p-8 text-white shadow-xl"
      >
        <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
        <p className="mb-6 opacity-90">
          Join thousands of businesses that are transforming their operations with our platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <PremiumButton variant="secondary">Get Started Free</PremiumButton>
          <PremiumButton variant="secondary">View Pricing</PremiumButton>
        </div>
      </motion.div>
    </motion.div>
  )
}
