
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBook, FiCheckCircle, FiAlertCircle, FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiSettings, FiGlobe, FiUser, FiFileText, FiBarChart2, FiCalendar } from 'react-icons/fi';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'team' | 'requester';
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose, role }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full text-brand-primary">
              <FiBook size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">คู่มือการใช้งานระบบ</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {role === 'team' ? 'สำหรับเจ้าหน้าที่และผู้ดูแลระบบ' : 'สำหรับผู้ขอรับบริการ (User)'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <FiX size={24} />
          </button>
        </header>

        {/* Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 text-gray-800 dark:text-gray-200 space-y-8">
          
          {role === 'requester' ? (
            // --- เนื้อหาสำหรับผู้สั่งงาน (Requester) ---
            <>
              <Section title="1. การเริ่มต้นใช้งาน (Getting Started)" icon={<FiUser />}>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>การลงทะเบียน:</strong> หากยังไม่มีบัญชี ให้กดปุ่ม "ลงทะเบียน" ที่หน้าแรก กรอกข้อมูลส่วนตัวให้ครบถ้วน (ชื่อ-สกุล, หน่วยงาน, อีเมล)</li>
                  <li><strong>การเข้าสู่ระบบ:</strong> 
                    <ul className="list-circle pl-5 mt-1 text-gray-600 dark:text-gray-400">
                      <li>เข้าสู่ระบบด้วย <strong>Username/Password</strong> ที่ตั้งไว้</li>
                      <li>หรือ เข้าสู่ระบบด้วย <strong>Microsoft Account (@tfac.or.th)</strong> เพื่อความสะดวกรวดเร็ว</li>
                    </ul>
                  </li>
                  <li><strong>แดชบอร์ดส่วนตัว:</strong> เมื่อเข้าระบบสำเร็จ จะพบกับหน้า "แจ้งงานใหม่" เป็นหน้าแรก</li>
                </ul>
              </Section>

              <Section title="2. การแจ้งงานใหม่ (Create Request)" icon={<FiFileText />}>
                <p className="mb-2">ท่านสามารถเลือกรูปแบบคำขอได้ 4 ประเภท:</p>
                <ul className="space-y-3 pl-2">
                  <li>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">1. งานใหม่ (New):</span> สำหรับการสั่งงานชิ้นเดียว เช่น โปสเตอร์ 1 ชิ้น
                  </li>
                  <li>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">2. แก้ไขงานเดิม (Edit):</span> สำหรับส่งไฟล์ให้แก้ไข หรือแจ้งปรับปรุงงานเดิม
                  </li>
                  <li>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">3. โปรเจกต์ (Project):</span> <strong>(แนะนำ!)</strong> สำหรับงานที่มีหลายชิ้นย่อยในโครงการเดียว เช่น งานสัมมนาที่ต้องทำทั้ง โปสเตอร์, แบนเนอร์, และใบประกาศ ท่านสามารถเพิ่ม "งานย่อย" ได้ไม่จำกัดในคำขอเดียว
                  </li>
                  <li>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">4. อื่นๆ (Other):</span> สำหรับงานที่ไม่เข้าพวก
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                  <strong>ข้อควรระวัง:</strong> กรุณาระบุ "วันที่ต้องการรับงาน" ให้เหมาะสม ระบบจะแจ้งเตือนหากระยะเวลากระชั้นชิดเกินไป (Lead Time) ตามประเภทงานนั้นๆ
                </div>
              </Section>

              <Section title="3. การติดตามสถานะงาน (My Requests)" icon={<FiSearch />}>
                <p>ท่านสามารถดูรายการงานทั้งหมดที่หน้า <strong>"งานที่สั่งแล้ว"</strong></p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>สถานะงาน:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge color="gray">ยังไม่ดำเนินการ</Badge> - งานได้รับเข้าระบบแล้ว รอเจ้าหน้าที่รับเรื่อง
                      <Badge color="yellow">กำลังดำเนินการ</Badge> - เจ้าหน้าที่กำลังทำงาน
                      <Badge color="green">เสร็จสิ้น</Badge> - งานเสร็จสมบูรณ์
                      <Badge color="red">ยกเลิก</Badge> - งานถูกยกเลิก (ดูเหตุผลได้ในรายละเอียด)
                    </div>
                  </li>
                  <li><strong>การค้นหาและกรอง:</strong> ใช้ช่องค้นหาเพื่อหาตามชื่องาน หรือกดปุ่ม "ตัวกรอง" เพื่อเลือกดูเฉพาะงานที่เสร็จแล้ว หรือ งานที่กำลังทำ</li>
                </ul>
              </Section>

              <Section title="4. การติดต่อสื่อสาร" icon={<FiGlobe />}>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>ติดต่อเจ้าหน้าที่:</strong> ปุ่มวงกลมขวาล่าง สามารถใช้ส่งข้อความถึงเจ้าหน้าที่ดูแลระบบได้โดยตรง</li>
                  <li><strong>หมายเหตุในงาน:</strong> ในแบบฟอร์มสั่งงาน ท่านสามารถระบุหมายเหตุเพิ่มเติม หรือลิงก์ไฟล์แนบขนาดใหญ่ได้</li>
                </ul>
              </Section>
            </>
          ) : (
            // --- เนื้อหาสำหรับทีมงาน (Team) ---
            <>
              <Section title="1. ภาพรวมและแดชบอร์ด (Dashboard)" icon={<FiBarChart2 />}>
                <p>หน้าแรกจะแสดงสรุปภาพรวมภาระงานทั้งหมดของทีม</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>Smart Filters:</strong> กดที่การ์ดสรุป (เช่น "กำลังดำเนินการ") เพื่อกรองรายการงานด้านล่างทันที</li>
                  <li><strong>กราฟสถิติ:</strong> แสดงสัดส่วนงานแยกตามสถานะ และประเภทงาน เพื่อวิเคราะห์ Workload</li>
                  <li><strong>การส่งออกรายงาน (Export):</strong> ที่ด้านล่างสุด สามารถเลือกช่วงวันที่เพื่อส่งออกรายงานเป็นไฟล์ <strong>CSV</strong> (Excel) หรือ <strong>DOC</strong> (Word) เพื่อทำรายงานสรุปประจำเดือน</li>
                </ul>
              </Section>

              <Section title="2. การจัดการงาน (Task Management)" icon={<FiCheckCircle />}>
                <p className="mb-2">หน้ารายการงานคือหัวใจหลักของการทำงาน</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>มุมมอง (View):</strong> เปลี่ยนมุมมองได้ 2 แบบคือ <FiGlobe className="inline"/> การ์ด (Card) และ รายการ (List)</li>
                  <li><strong>การมอบหมายงาน (Assign):</strong>
                    <ul className="list-circle pl-5 mt-1 text-gray-600 dark:text-gray-400">
                      <li>กดเข้าไปที่งาน เลือก <strong>"ผู้รับผิดชอบ (หลัก)"</strong></li>
                      <li>สามารถกด <strong>"เพิ่มผู้รับผิดชอบร่วม"</strong> ได้ หากงานนั้นทำหลายคน</li>
                    </ul>
                  </li>
                  <li><strong>การอัปเดตสถานะ:</strong> เปลี่ยนสถานะงานได้ทันที หากเลือก <strong>"ยกเลิก"</strong> ระบบจะบังคับให้ระบุเหตุผลเสมอ</li>
                  <li><strong>การบันทึก (Notes):</strong> ทีมงานสามารถพิมพ์บันทึกช่วยจำ หรือความคืบหน้าในตัวงานได้ (เห็นเฉพาะภายในทีม)</li>
                  <li><strong>ลบหลายรายการ (Bulk Delete):</strong> กดปุ่ม "จัดการหลายรายการ" เพื่อติ๊กเลือกงานที่ต้องการลบทีละมากๆ ได้</li>
                </ul>
              </Section>

              <Section title="3. ปฏิทินงาน (Calendar)" icon={<FiCalendar />}>
                <p>แสดงงานในรูปแบบปฏิทิน รายเดือน/สัปดาห์/วัน</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>แถบสีจะแสดงตามประเภทของงาน (เช่น สีแดง=โบรชัวร์, สีส้ม=แบนเนอร์)</li>
                  <li>สามารถกดวันที่ว่าง เพื่อเพิ่ม <strong>"เหตุการณ์ (Event)"</strong> หรือวันหยุด ที่ไม่ใช่งานสั่งทำได้</li>
                  <li>กดที่แถบงานเพื่อเปิดดูรายละเอียด</li>
                </ul>
              </Section>

              <Section title="4. การตั้งค่าระบบ (Settings)" icon={<FiSettings />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-3 border rounded-lg dark:border-gray-700">
                    <h4 className="font-bold mb-1">จัดการประเภทงาน</h4>
                    <p className="text-sm">เพิ่ม/ลบ ประเภทงานที่รับทำ, กำหนดสี, และกำหนดระยะเวลาขั้นต่ำ (Lead Time) เพื่อแจ้งเตือนผู้สั่งงาน</p>
                  </div>
                  <div className="p-3 border rounded-lg dark:border-gray-700">
                    <h4 className="font-bold mb-1">จัดการส่วนงาน (Department)</h4>
                    <p className="text-sm">เพิ่ม/แก้ไข รายชื่อแผนกต่างๆ ในองค์กร เพื่อให้ผู้สั่งงานเลือก</p>
                  </div>
                  <div className="p-3 border rounded-lg dark:border-gray-700">
                    <h4 className="font-bold mb-1">นำเข้าข้อมูล (Import)</h4>
                    <p className="text-sm">รองรับการนำเข้าไฟล์ JSON เพื่อย้ายข้อมูลเก่าเข้าระบบ</p>
                  </div>
                  <div className="p-3 border rounded-lg dark:border-gray-700">
                    <h4 className="font-bold mb-1">การแสดงผล</h4>
                    <p className="text-sm">เปิด/ปิด การแสดงสถานะงานให้ผู้สั่งงานเห็น (Status Visibility)</p>
                  </div>
                </div>
              </Section>
            </>
          )}

        </main>

        {/* Footer */}
        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-transform hover:scale-105"
          >
            เข้าใจแล้ว
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

// Helper Components
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-brand-primary dark:text-blue-400">
      {icon} {title}
    </h3>
    <div className="pl-7 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {children}
    </div>
  </section>
);

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const colors: {[key: string]: string} = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

export default UserManualModal;
