import { Resolver } from 'node:dns/promises'
import * as childprocess from 'node:child_process'
import fs from 'fs';
import util from 'node:util'

const exec = util.promisify(childprocess.exec)


export default async (arr) => {

    const url = arr[0];
    const host = new URL(url).host;
    let dns = []
    const dnsFilePath = new URL('./dns.json', import.meta.url);


    if (fs.existsSync(dnsFilePath) && arr.indexOf('--disable-dns-cache') === -1) {
        console.log('Use DNS cache, add --disable-dns-cache to refresh.')
        dns = JSON.parse(String(fs.readFileSync(dnsFilePath)));
    } else {
        let list = []
        const urls = [
            'https://public-dns.info/nameserver/sg.json',
            'https://public-dns.info/nameserver/cn.json',
            'https://public-dns.info/nameserver/am.json',
            'https://public-dns.info/nameserver/jp.json',
            'https://public-dns.info/nameserver/fr.json'
        ]
        for (let i = 0; i < urls.length; i++) {
            list = list.concat(
                (await fetch(urls[i]).then(d => d.json())).map(t => t.ip)
            )
        }

        dns = Array.from(new Set(list))

        fs.writeFileSync(dnsFilePath, JSON.stringify(dns, null, 2));
    }


    console.log(`DNS count ${dns.length}.`);
    console.log(`Start resolve ${host} to ips.`)
    let ips = []
    let ipsPromises = []
    for (let i = 0; i < dns.length; i++) {
        const resolver = new Resolver({ timeout: 2000, tries: 4 })
        resolver.setServers([dns[i]])

        ipsPromises.push(
            resolver
                .resolve(host)
                .then(list => {
                    if (list && list.length > 0) {
                        ips = ips.concat(list)
                    }
                })
                .catch(err => { })
        )

        // console.log(ips)
    }

    await Promise.all(ipsPromises)

    ips = Array.from(new Set(ips))
    // ips = ips.concat(['140.82.113.3', '20.200.245.245'])

    console.log(`IP number ${ips.length}.`);
    console.log(`Start curl test.`)

    let curlPromises = []
    const start = Date.now()
    for (let j = 0; j < ips.length; j++) {

        curlPromises.push(
            !(ip =>
                exec(
                    `curl -s ${url} -m 5 --resolve ${host}:443:${ip} --resolve ${host}:80:${ip}`
                )
                    .then(result => {
                        if (String(result?.stdout).length > 0) {
                            console.log(`${ip} is ok, time: ${(Date.now() - start)}`)
                        } else {
                            console.log(`${ip} is zero, time: ${(Date.now() - start)}`)
                        }
                    })
                    .catch(err => {
                        // console.log(`${ip} is error`)
                    }))(ips[j])
        )
    }

    await Promise.all(curlPromises)
    console.log('myhosts finished.')
}
