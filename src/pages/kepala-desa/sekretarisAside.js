import Link from "next/link";

export default function SekretarisAside() {
    const onLogout = () => {
        // const isLogin = localStorage.getItem('isLogin');
        // if (isLogin === "true") {
        //     localStorage.setItem("isLogin", false);
        // }
        localStorage.removeItem("isLogin");
    }
    return (
        <>
            <aside>
                <section style={{ height: '25%' }}>
                    <div className="container-fluid text-light d-flex flex-column align-items-center">
                        <h5>Kantor Desa Pao</h5>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Luwu_Utara_Logo_%28North_Luwu%29.png" alt="Profile" width={100} height={120} />
                    <div />
                </section>
                <section style={{ height: '75%', paddingTop: '30px' }}>
                    <span style={{ width: '90%' }}>
                        <button style={{ fontSize: '14px', backgroundColor: '#fff' }}>
                            Surat Masuk dan Keluar
                        </button>
                    </span>
                    <Link href="/sekretaris" className="d-flex justify-content-center">
                        <span style={{ width: '80%' }}>
                            <button className='logout' onClick={onLogout}>Logout
                                <svg style={{ marginLeft: '10px' }} xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                    <path d="M1.66667 15C1.20833 15 0.816111 14.8369 0.49 14.5108C0.163889 14.1847 0.000555556 13.7922 0 13.3333V1.66667C0 1.20833 0.163333 0.816111 0.49 0.49C0.816667 0.163889 1.20889 0.000555556 1.66667 0H6.66667C7.1269 0 7.5 0.373096 7.5 0.833333C7.5 1.29357 7.1269 1.66667 6.66667 1.66667H1.66667V13.3333H6.66667C7.1269 13.3333 7.5 13.7064 7.5 14.1667C7.5 14.6269 7.1269 15 6.66667 15H1.66667ZM11.4377 11.0623C11.1065 11.3935 10.5675 11.3863 10.2452 11.0465C9.93483 10.7192 9.94166 10.2042 10.2606 9.88521L11.8125 8.33333H5.83333C5.3731 8.33333 5 7.96024 5 7.5C5 7.03976 5.3731 6.66667 5.83333 6.66667H11.8125L10.2606 5.11479C9.94166 4.79583 9.93483 4.28085 10.2452 3.95353C10.5675 3.6137 11.1065 3.60655 11.4377 3.93771L15 7.5L11.4377 11.0623Z" fill="white" />
                                </svg>
                            </button>
                        </span>
                    </Link>
                </section>
            </aside>
        </>
    )
}
