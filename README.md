# myhosts

    Find your best and fast IP to visit site.

# HOW

```sh
$ npx myhosts https://github.com
Use DNS cache, add --disable-dns-cache to refresh.
DNS count 16617.
Start resolve github.com to IPs.
Pushing...      16617/16617 100.00% 
✅ Push done.
Resolving...    16617/16617 100.00% 
✅ Resolve done.
IP number 22.
Testing...      22/22 100.00% 
✅ Test done.

20.200.245.247          is ok,  time: 839
20.207.73.82            is ok,  time: 1282
20.248.137.48           is ok,  time: 1451
192.30.255.112          is ok,  time: 1523
20.233.83.145           is ok,  time: 1524
140.82.112.4            is ok,  time: 1678
140.82.113.3            is ok,  time: 1711
192.30.255.113          is ok,  time: 1750
140.82.114.4            is ok,  time: 2214
20.27.177.113           is ok,  time: 2569
20.87.245.0             is ok,  time: 2730
140.82.112.3            is ok,  time: 8400
140.82.113.4            is ok,  time: 9418

🎉 Curl test done. You have 13 IPs available.
All done!
```

# 国内用户

    如果国内用户 npx 太慢的话，可指定镜像执行。

```sh
$ npx --registry=https://registry.npmmirror.com myhosts https://github.com
```
