import Link from "next/link";
import logo from "../../assets/logo.png";
export default function Dashboard() {
  return (
    <>
      <header className="text-2xl font-bold mb-4 flex">my app</header>
      <section className="hidden flex flex-col space-x-4  border-r-2 border-gray-80 w-60 min-h-screen z-40">
        <div className="flex items-center space-x-2 mb-4 border-b-2 w-60 pt-2 pb-4">
          <img src={logo.src} alt="Logo" className="w-16 h-16" />
        </div>
        {/* Navigation */}
        <section className="flex flex-col space-y-4 pl-4 ">
          <Link href="#" className="text-lg font-semibold">
            Dashboard
          </Link>
          <Link href="#" className="text-lg font-semibold">
            Live Classes
          </Link>
          <Link href="#" className="text-lg font-semibold">
            Tasks
          </Link>
          <Link href="#" className="text-lg font-semibold">
            Results
          </Link>
          <Link href="#" className="text-lg font-semibold">
            Billing
          </Link>
          <Link href="#" className="text-lg font-semibold">
            Settings
          </Link>
        </section>
        {/* User Name and Email */}
        <div className="flex flex-col space-y-2 mt-auto mb-4 pl-4">
          <p className="text-lg font-semibold">John Doe</p>
          <p className="text-gray-500">john.doe@example.com</p>
        </div>
      </section>
    </>
  );
}
