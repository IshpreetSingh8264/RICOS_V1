import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal = ({ isOpen, onClose }: TermsAndConditionsModalProps) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4 sm:p-6 md:p-8"
            style={{ zIndex: 99999 }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Terms and Conditions
                </h2>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6 text-slate-300">
                  {/* Last Updated */}
                  <p className="text-xs sm:text-sm text-slate-400 italic">
                    Last Updated: November 16, 2025
                  </p>

                  {/* Introduction */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">1. Introduction</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      Welcome to RICOS (Rapid Incident Coordination Suite). By accessing or using our platform, 
                      you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
                    </p>
                  </section>

                  {/* Acceptance of Terms */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">2. Acceptance of Terms</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      By creating an account or using RICOS, you acknowledge that you have read, understood, and agree 
                      to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any 
                      part of these terms, you may not use our services.
                    </p>
                  </section>

                  {/* User Accounts */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">3. User Accounts</h3>
                    <div className="space-y-2 text-sm sm:text-base">
                      <p className="leading-relaxed">
                        <strong className="text-white">3.1 Account Types:</strong> RICOS offers different account types 
                        including User Accounts, Government Responder Accounts, NGO Accounts, and Volunteer Accounts.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-white">3.2 Account Security:</strong> You are responsible for maintaining 
                        the confidentiality of your account credentials and for all activities that occur under your account.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-white">3.3 Accurate Information:</strong> You agree to provide accurate, 
                        current, and complete information during registration and to update such information to maintain its accuracy.
                      </p>
                    </div>
                  </section>

                  {/* Use of Services */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">4. Use of Services</h3>
                    <div className="space-y-2 text-sm sm:text-base">
                      <p className="leading-relaxed">
                        <strong className="text-white">4.1 Permitted Use:</strong> RICOS is designed for crisis coordination 
                        and emergency response. You agree to use the platform only for its intended purpose.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-white">4.2 Prohibited Activities:</strong> You may not:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Submit false or misleading information about incidents</li>
                        <li>Interfere with or disrupt the platform's operation</li>
                        <li>Attempt to gain unauthorized access to any part of the system</li>
                        <li>Use the platform for any illegal or unauthorized purpose</li>
                        <li>Harass, abuse, or harm other users</li>
                      </ul>
                    </div>
                  </section>

                  {/* Incident Reporting */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">5. Incident Reporting</h3>
                    <div className="space-y-2 text-sm sm:text-base">
                      <p className="leading-relaxed">
                        <strong className="text-white">5.1 Accuracy:</strong> Users must ensure that all incident reports 
                        are accurate, truthful, and submitted in good faith.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-white">5.2 Emergency Services:</strong> RICOS is a coordination tool and 
                        should not replace emergency services (911, 112, etc.). In case of immediate danger, contact local 
                        emergency services first.
                      </p>
                    </div>
                  </section>

                  {/* Data Privacy */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">6. Data Privacy and Security</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      We take data privacy seriously. Your personal information and incident data will be handled in 
                      accordance with our Privacy Policy. By using RICOS, you consent to the collection, use, and 
                      sharing of information as described in our Privacy Policy.
                    </p>
                  </section>

                  {/* Intellectual Property */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">7. Intellectual Property</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      All content, features, and functionality of RICOS, including but not limited to text, graphics, 
                      logos, and software, are the exclusive property of RICOS and are protected by international 
                      copyright, trademark, and other intellectual property laws.
                    </p>
                  </section>

                  {/* Limitation of Liability */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">8. Limitation of Liability</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      RICOS is provided "as is" without warranties of any kind. We do not guarantee the accuracy, 
                      completeness, or timeliness of information on the platform. In no event shall RICOS be liable 
                      for any indirect, incidental, special, consequential, or punitive damages arising from your use 
                      of the platform.
                    </p>
                  </section>

                  {/* Termination */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">9. Termination</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      We reserve the right to suspend or terminate your account at any time, without notice, for 
                      conduct that we believe violates these Terms and Conditions or is harmful to other users, 
                      us, or third parties, or for any other reason.
                    </p>
                  </section>

                  {/* Changes to Terms */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">10. Changes to Terms</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      We reserve the right to modify these Terms and Conditions at any time. We will notify users 
                      of any material changes via email or through the platform. Continued use of RICOS after such 
                      modifications constitutes acceptance of the updated terms.
                    </p>
                  </section>

                  {/* Governing Law */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">11. Governing Law</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      These Terms and Conditions shall be governed by and construed in accordance with applicable 
                      international laws and regulations governing emergency response systems and data protection.
                    </p>
                  </section>

                  {/* Contact Information */}
                  <section className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">12. Contact Us</h3>
                    <p className="text-sm sm:text-base leading-relaxed">
                      If you have any questions about these Terms and Conditions, please contact us at:
                    </p>
                    <div className="text-sm sm:text-base pl-4">
                      <p>Email: legal@ricos.org</p>
                      <p>Support: support@ricos.org</p>
                    </div>
                  </section>

                  {/* Agreement */}
                  <section className="space-y-3 pt-4 border-t border-slate-700">
                    <p className="text-sm sm:text-base leading-relaxed font-semibold text-white">
                      By using RICOS, you acknowledge that you have read and understood these Terms and Conditions 
                      and agree to be bound by them.
                    </p>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-700 flex justify-end">
                <Button
                  onClick={onClose}
                  className="px-6 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default TermsAndConditionsModal;
