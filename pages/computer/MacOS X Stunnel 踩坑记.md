由于新冠病毒疫情影响2020春节后，公司根据国家要求开始实行远程办公。其中上传下载aar的地址repo.microfun.com.cn采用了外网访问使用https的机制，需要使用硬件钥匙中的证书。然后就开始采坑之旅。

一开始插上usbkey后，使用浏览器访问repo时，会弹出使用usbkey填PIN码的弹窗。输入PIN码后可以正常下载。但是Android Studio并不会主动使用usbkey。找了一圈Android Studio和gradle的配置没有相关的。（但是找到一个可以使用账号密码来下载上传的配置，后期服务器上是否能支持这种方式。）因此只能使用全局配置来实现了。
根据邮件方案，windows 需要安装一个stunnel来使全局使用usbkey。搜了一下Mac上也有stunnel，而且的确也是这个作用（https://www.systutorials.com/docs/linux/man/8-stunnel/）。

## 1、安装stunnel

找到的最方便的方法就是使用**brew**来安装，我的mac上还没有brew，所以首先安装brew。

    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    
这里也提供一下卸载方法：

    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall)"
    
brew可以根据包来搜索、安装、卸载等，可以参考这篇文章 https://www.jianshu.com/p/c60789934af1 。
或者使用**brew help**

    Example usage:
      brew search [TEXT|/REGEX/]
      brew info [FORMULA...]
      brew install FORMULA...
      brew update
      brew upgrade [FORMULA...]
      brew uninstall FORMULA...
      brew list [FORMULA...]
    
    Troubleshooting:
      brew config
      brew doctor
      brew install --verbose --debug FORMULA
    
    Contributing:
      brew create [URL [--no-fetch]]
      brew edit [FORMULA...]
    
    Further help:
      brew commands
      brew help [COMMAND]
      man brew
      https://docs.brew.sh

使用以下命令就可以安装 stunnel了，

    brew install stunnel
    
注意：安装stunnel是最新的，依赖openssl，所以会自动安装上最新openssl@1.1.1d。
这时根据/usr/local/etc/stunnel/stunnel.conf-sample来修改一个/usr/local/etc/stunnel/stunnel.conf

    fips = no
    engine = pkcs11
    options = NO_SSLv2
     
    [microfun_repo]
    client = yes
    accept = 192.168.189.1:7611 ; 这个地址是本机地址，一般选择主机和 VM 之间那个网卡的 IP，这样桌面和 VM 里的程序都可以访问。
    connect = repo.corp.microfun.cn:443
    engineID = pkcs11
    
然后启动stunnel 运行 

    sudo stunnel
    
会在engine = pkcs11报错:找不到pkcs11。
这里也附上关闭的方法：

    > ps aux | grep stunnel | grep root | awk '{print $2}'| xargs sudo kill -9
或者:

    > cat /usr/local/etc/stunnel/stunnel.pid | xargs sudo kill -9

使用openssl engine来查看openssl的engine
发现mac根本不支持使用openssl engine，使用openssl version发现新版mac系统使用的是LibreSSL, 那我们不是刚才用brew安装了openssl了，只要调用新装的openssl不就行了吗？我们可以在 .bash_profile添加PATH或者使用下面命令
强制链接到openssl

    brew link openssl --force
    
然后openssl version一下，发现是新安装的openssl了。
    
    openssl version
    OpenSSL 1.1.1d  10 Sep 2019
    
然后再

    openssl engine -t
    
    (rdrand) Intel RDRAND engine
     [ available ]
    (dynamic) Dynamic engine loading support
     [ unavailable ]
    
发现只有两个engine,而且并没有pkcs11。那我们就要安装pkcs11。

## 2、安装pkcs11
网上搜了一下，需要安装opensc-pkcs11,垃圾百度找到的都是去这个地址 http://www.opensc-project.org/opensc 下载，然而死活打不来，然后再搜，发现换地址了。然后在这个地址下载https://github.com/OpenSC/OpenSC，下载opensc-0.20.0.tar.gz后解压一看，也萌了，不知道怎么用，然后又搜。后来找到需要在解压后的文件夹下使用下面三个命令来安装。

    ./configure
    make
    make install
    
    make clean 清除上一次make的东西
    make distclean 可以清除configure生成的东西
    
安装好后再次运行sudo stunnel, 发现还是找不到pkcs11，openssl engine -t里面也没有pkcs11.后来发现https://github.com/OpenSC里面有engine_pkcs11项目，上面写着OpenSSL engine for PKCS#11 modules。啊！好像应该装这个，安装方法同OpenSC，但是第一步./configure就报错，找不到libp11, 幸运的是在这个github上有libp11。于是又如法炮制安装libp11，发现还是第一步./configure就报错，找不OPENSSL和libcrypto，发现/usr/local/Cellar/openssl@1.1/1.1.1d/lib里有libcrypto，试了好多方法设置参数什么的，包括LDFLAGS, CPPFLAGS, PKG_CONFIG_PATH  搞了好久都没有搞定。
最后发现brew中可以安装libp11.

    brew install libp11
    
接着再回来安装engine_pkcs11，发现还是找不到libp11。试了好多方法,之前的LDFLAGS, CPPFLAGS, PKG_CONFIG_PATH又设置了一遍还是不管用，brew中没有接着再回来安装engine_pkcs11。后来打开了configure文件找到报错的地方，发现lib是从PKG_CONFIG参数中获取的，然后有上网去找PKG_CONFIG是啥，发现是个服务需要安装，然后又安装pkg-config。

    brew install pkg-config
    
安装好后可以配置PKG_CONFIG_PATH了，把之前装的项目中lib/pkgconfig/*.pc都放进去。然后engine_pkcs11就可以.configure了。

## 3、重新安装openssl

本来挺高兴以为可以装上engine_pkcs11了，结果高兴太早了，make的时候报错了，有些类找不到好像是openssl/dso.h。后来知道是openssl的版本不匹配。然后又去https://github.com/openssl/openssl/releases下载1.0.2版本。用brew把原来的openssl卸载掉。
安装openssl稍有不同，需要使用命令：

    ./Configure darwin64-x86_64-cc
    
来在mac上安装。不然会在后面的make上报错。
然后看下openssl的版本：

    MacBook-Pro-Xi:~ adrian_xi$ openssl version
    OpenSSL 1.0.2u  20 Dec 2019

然后运行sudo stunnel 发现里面使用的还是1.1.1d的openssl，还错报错找不到相关的openssl，本来以为是stunnel中的某个配置可以指定openssl，后来发现不行，只能删掉最新的stunnel换个旧的。
brew中也找不到其他版本的stunnel，只能去网站上下，在官网上查看log然后选择了5.49版本，然后安装同上。然后运行还是报错

    MacBook-Pro-Xi:~ adrian_xi$ sudo stunnel
    Password:
    [ ] Clients allowed=125
    [.] stunnel 5.49 on x86_64-apple-darwin19.3.0 platform
    [.] Compiled/running with OpenSSL 1.0.2u  20 Dec 2019
    [.] Threading:PTHREAD Sockets:POLL,IPv6 TLS:ENGINE,FIPS,OCSP,PSK,SNI
    [ ] errno: (*__error())
    [.] Reading configuration from file /usr/local/etc/stunnel/stunnel.conf
    [.] UTF-8 byte order mark detected
    [ ] Enabling support for engine "pkcs11"
    [!] error queue: 2606A074: error:2606A074:engine routines:ENGINE_by_id:no such engine
    [!] ENGINE_by_id: 260B6091: error:260B6091:engine routines:DYNAMIC_LOAD:version incompatibility
    [!] /usr/local/etc/stunnel/stunnel.conf:30: "engine = pkcs11": Failed to open the engine
    [ ] Deallocating section defaults

因为openssl中还是没有pkcs11引擎。

    MacBook-Pro-Xi:~ adrian_xi$ openssl engine -t
    (rdrand) Intel RDRAND engine
         [ available ]
    (dynamic) Dynamic engine loading support
         [ unavailable ]
    (4758cca) IBM 4758 CCA hardware engine support
         [ unavailable ]
    (aep) Aep hardware engine support
         [ unavailable ]
    (atalla) Atalla hardware engine support
         [ unavailable ]
    (cswift) CryptoSwift hardware engine support
         [ unavailable ]
    (chil) CHIL hardware engine support
         [ unavailable ]
    (nuron) Nuron hardware engine support
         [ unavailable ]
    (sureware) SureWare hardware engine support
         [ unavailable ]
    (ubsec) UBSEC hardware engine support
         [ unavailable ]
    (gost) Reference implementation of GOST engine
         [ available ]
         
又查了一下在openssl.cnf加上以下配置：

    openssl_conf = openssl_def 

    [ openssl_def ]
    engines = engine_section
    
    [ engine_section ]
    pkcs11 = pkcs11_section
    
    [ pkcs11_section ]
    engine_id = pkcs11
    dynamic_path = /usr/local/ssl/lib/engines/libpkcs11.so
    MODULE_PATH = /usr/local/lib/opensc-pkcs11.so
    init = 0
         
结果还是不行，用dynamic加载pkcs11的方法，输入：

    MacBook-Pro-Xi:~ adrian_xi$ openssl engine -t dynamic -pre SO_PATH:/usr/local/ssl/lib/engines/libpkcs11.so -pre ID:pkcs11 -pre LIST_ADD:1 -pre LOAD -pre MODULE_PATH:/usr/local/lib/opensc-pkcs11.so
    (dynamic) Dynamic engine loading support
    [Success]: SO_PATH:/usr/local/ssl/lib/engines/libpkcs11.so
    [Success]: ID:pkcs11
    [Success]: LIST_ADD:1
    [Success]: LOAD
    [Success]: MODULE_PATH:/usr/local/lib/opensc-pkcs11.so
    Loaded: (pkcs11) pkcs11 engine
         [ available ]
         
看上去好像成功了，但实际上运行stunnel还是同样的报错，查看openssl engine也没有增加pkcs11。如果给stunnel配置dynamic的话则在LOAD时报错。

    engine = dynamic
    engineCtrl=SO_PATH:/usr/local/ssl/lib/engines/libpkcs11.so
    engineCtrl=ID:pkcs11
    engineCtrl=LIST_ADD:1
    engineCtrl=LOAD
    engineCtrl=MODULE_PATH:/usr/local/lib/opensc-pkcs11.so
    engineCtrl=INIT
    
到这后我就放弃了。实在没办法了。
    
