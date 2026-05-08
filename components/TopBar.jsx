const { useEffect, useState } = React;

const NAV = [
{ id: "home", label: "Home" },
{ id: "about", label: "About" },
{ id: "servizi", label: "Servizi" },
{ id: "case", label: "Case" },
{ id: "team", label: "Team" },
{ id: "dove", label: "Territorio" },
{ id: "clients", label: "Clients" },
{ id: "contatti", label: "Contatti" }];


function TopBar() {
  const [active, setActive] = useState("home");
  useEffect(() => {
    const onScroll = () => {
      let cur = "home";
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top <= 120) cur = n.id;
        }
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <header className="topbar">
      <div className="topbar-brand">Nemo<span>·</span>Hub</div>
      <nav className="topbar-nav">
        {NAV.map((n) =>
        <a key={n.id} href={`#${n.id}`} onClick={(e) => go(e, n.id)} className={active === n.id ? "active" : ""}>{n.label}</a>
        )}
      </nav>
      <a className="topbar-cta" href="#contatti" onClick={(e) => go(e, "contatti")} style={{ color: "rgb(0, 0, 0)" }}>Parliamo →</a>
    </header>);

}
window.TopBar = TopBar;