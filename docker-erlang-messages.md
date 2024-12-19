---
lang: en
last_modified_at: 2017-03-14
---
## Messaging between Erlang nodes in Docker containers

### Ping between nodes

Start Erlang docker container with host name `host_a`.
```
docker run -it --rm --name host_a -h host_a erlang bash
```
Start Erlang docker container with host name `host_b` and link to container `host_a`.
```
docker run -it --rm --name host_b -h host_b --link host_a erlang bash
```

On `host_a` start Erlang shell with short name `node_a` and magick cookie.
```
root@host_a:/# erl -sname node_a -setcookie cookie
```
On `host_b` start Erlang shell with short name `node_b` and same magick cookie.
```
root@host_b:/# erl -sname node_b -setcookie cookie
```

From `node_b@host_b` ping `node_a@host_a`.
```
(node_b@host_b)> net_adm:ping('node_a@host_a').
pong
```

Now from `node_a@host_a` is visible `node_b@host_b` and vice versa.
```
(node_a@host_a)> nodes().
[node_b@host_b]
```
```
(node_b@host_b)> nodes().
[node_a@host_a]
```

On `node_a@host_a` register shell process as `receiver`
```
(node_a@host_a)> register(receiver, self()).
true
```
and the same on `node_b@host_b`.
```
(node_b@host_b)> register(receiver, self()).
true
```

Now we can send message to process on another node
```
(node_a@host_a)> {receiver, 'node_b@host_b'} ! msg_from_a.
msg_from_a
```
and them receive message.
```
(node_b@host_b)> flush().
Shell got msg_from_a
ok
```

And so fort back.
```
(node_b@host_b)> {receiver, 'node_a@host_a'} ! msg_from_b.
msg_from_b
```
```
(node_a@host_a)> flush().
Shell got msg_from_b
ok
```
