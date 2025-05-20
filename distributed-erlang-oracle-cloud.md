---
last_modified_at: 2025-05-20
---
## Distribuovaný Erlang v Oracle Cloud

### Zadání
* Chceme mít v Oracle Cloud 2 instance
* Na každé instanci poběží Erlang _node_
* _Nody_ mezi sebou budou moci komunikovat

### Realizace

#### Příprava instancí

V [Oracle Cloud konzoli](https://cloud.oracle.com/) se proklikáme až do [Compute > Instances](https://cloud.oracle.com/compute/instances) a vytvoříme si 2 instance.
Důležité je, aby obě instance byly ve stejném subnetu.

Dále si pro danný subnet v [Networking > Virtual Cloud Networks](https://cloud.oracle.com/networking/vcns) > _náš subnet_ > "Security Lists" > "Default Security List for _náš subnet_" vytvoříme Ingress pravidlo.
|Stateless|Source Type|Source CIDR|IP Protocol|Source Port Range|Destination Port Range|Description      |
|---------|-----------|-----------|-----------|-----------------|----------------------|-----------------|
|No       |CIDR       |10.0.0.0/16|TCP        |_ALL_            |4369                  |EPMD             |
|No       |CIDR       |10.0.0.0/16|TCP        |_ALL_            |9100-9155             |EPMD - komunikace|

Tím jsme si vytvořili firewall pravidlo, které se bude aplikovat na naše instance **zvenčí**.

Abychom povolili komunikaci i **zevnitř** instance, musíme přidat pravidla pro `iptables`. V instanci přidáme záznamy do `/etc/iptables/rules.v4`
```
-A INPUT -p tcp -s 10.0.0.0/16 --dport 4369 -j ACCEPT
-A INPUT -p tcp -s 10.0.0.0/16 --dport 9100:9155 -j ACCEPT
```
Následně pravidla aplikujeme `iptables-restore < /etc/iptables/rules.v4` a ověříme `iptables -L`.

#### Spuštění Erlang nodů

(Dokumentace k [Distributed Erlang](https://www.erlang.org/doc/system/distributed.html))

Na každé instanci spustíme node s odpovídajícím jménem a stejným cookie.
```bash
# instance 1
erl -name node1@interní-IP-instance-1 -setcookie susenka -kernel inet_dist_listen_min 9100 inet_dist_listen_max 9155
```
```bash
# instance 2
erl -name node2@interní-IP-instance-2 -setcookie susenka -kernel inet_dist_listen_min 9100 inet_dist_listen_max 9155
```

Nyní již stačí na jednom z nodů _pingnout_ druhý node a nody na sebe vidí.
```erlang
(node1@10.0.0.79)1> net_adm:ping('node2@10.0.0.136').
pong
(node1@10.0.0.79)2> nodes().
['node2@10.0.0.136']
```
```erlang
(node2@10.0.0.136)1> nodes().
['node1@10.0.0.79']
```

#### Komunikace nodů

Pro otestování si vytvoříme na každé z instancí soubor `say.erl`
```erlang
-module(say).
-export([hello/0]).

hello() ->
    io:format("Hello from node ~p!~n", [node()]).
```
Na každém z nodů si jej zkompilujeme a můžeme zavolat na druhém z nodů.
```erlang
(node1@10.0.0.79)3> c(say).
{ok,say}
(node1@10.0.0.79)4> rpc:call('node2@10.0.0.136', say, hello, []).
Hello from node 'node2@10.0.0.136'!
ok
```
