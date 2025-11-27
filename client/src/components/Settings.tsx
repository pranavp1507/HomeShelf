import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, Button } from "./ui";
import {
  Server,
  Database,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { config } from "../config";

interface SystemInfo {
  version: string;
  nodeEnv: string;
  databaseConnected: boolean;
  emailEnabled: boolean;
  overdueChecksEnabled: boolean;
}

const Settings = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.apiUrl}/system/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch system information");
      }

      const data = await response.json();
      setSystemInfo(data);
    } catch (err: any) {
      console.error("Error fetching system info:", err);
      setError(err.message);
      // Set default values if API is not available yet
      setSystemInfo({
        version: "1.0.0",
        nodeEnv: "unknown",
        databaseConnected: true,
        emailEnabled: false,
        overdueChecksEnabled: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ enabled }: { enabled: boolean }) => (
    <div className="flex items-center gap-2">
      {enabled ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Enabled
          </span>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Disabled
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            System Status
          </h1>
          <p className="text-text-secondary">
            View your library system information and status
          </p>
        </div>

        {/* System Information */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Server className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">
                System Information
              </h2>
              <p className="text-sm text-text-secondary">
                Current system status and configuration
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-text-secondary">
              Loading system information...
            </div>
          ) : error && !systemInfo ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
              <Button
                variant="ghost"
                onClick={fetchSystemInfo}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : systemInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Application Version
                  </label>
                  <div className="text-lg font-semibold text-text-primary">
                    {systemInfo.version}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Environment
                  </label>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary/10 dark:bg-primary/20 text-primary">
                    {systemInfo.nodeEnv}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Database className="h-4 w-4 inline mr-1" />
                    Database Connection
                  </label>
                  <StatusBadge enabled={systemInfo.databaseConnected} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Notifications
                  </label>
                  <StatusBadge enabled={systemInfo.emailEnabled} />
                  {!systemInfo.emailEnabled && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Configure SMTP settings in environment variables to enable
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Overdue Checks
                  </label>
                  <StatusBadge enabled={systemInfo.overdueChecksEnabled} />
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;
