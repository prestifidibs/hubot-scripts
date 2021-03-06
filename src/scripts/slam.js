// Description:
//   Slams from Ders and others
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   (Slam|Burn) - Get Slammed
//
// Author:
//   taylor, andromedado

var images = [
    "http://38.media.tumblr.com/tumblr_m825bbnJIA1qam74xo1_500.gif",
    "http://33.media.tumblr.com/tumblr_m7dpky3KDX1rof6ulo1_500.gif",
    "http://i.imgur.com/ct3PcLA.gif",
    "http://reactiongif.org/wp-content/uploads/GIF/2014/08/GIF-amazing-classic-funny-OMG-rap-rapper-shocked-stare-Supa-Hot-Fire-surprised-GIF.gif",
    "http://media.giphy.com/media/xvWLAWTMsaEtG/giphy.gif",
    "http://data.whicdn.com/images/47936497/large.gif",
    "http://i58.photobucket.com/albums/g246/sey115/Photobucket%20Desktop%20-%20Sage%20Youngs%20MacBook/Funny%20and%20Random/willsmithsurprised_zpsbf418514.gif",
    "https://31.media.tumblr.com/1f7b873fec16573d26011e481ed0e50e/tumblr_inline_n1hy48UTMW1qklnuf.gif",
    "http://24.media.tumblr.com/tumblr_ma4vh18eP61rz79v5o2_500.gif",
    "http://massivnews.com/wp-content/uploads/2013/01/Christian-Bale-0001.gif",
    "https://38.media.tumblr.com/be1396e7b6d816233cad6deea60cff39/tumblr_nrkl22d6HW1tq4of6o1_400.gif",
    "https://d.gr-assets.com/hostedimages/1380365332ra/717283.gif",
    "https://i.imgur.com/2YnBth.jpg",
    "http://img1.wikia.nocookie.net/__cb20140712001317/survivor-org/images/5/59/Daaaamn.gif",
    "http://stream1.gifsoup.com/view7/2905081/daaaamn-o.gif",
    "http://imgur.com/xbKAw3s.gif",
    "http://24.media.tumblr.com/eea48b8232cd44ed1be871056a487998/tumblr_mly5rsm5nL1qbipv3o1_500.gif",
    "http://o.aolcdn.com/hss/storage/midas/c7c1534382efd62189f83a3461fd815c/200512318/andy-dwyer-gif.gif",
    "http://i.dailymail.co.uk/i/pix/2012/11/20/lakers_gif.gif",
    "http://i937.photobucket.com/albums/ad219/one_man_show_2010/lool.gif",
    "http://37.media.tumblr.com/91b05eeeceff90169f57a9c67d56de19/tumblr_mt8wwkvfXg1sin6fio1_500.gif",
    "http://i.imgur.com/PMdpq.gif",
    "http://i.imgur.com/M1yKgjm.gif",
    "http://wwwcache.wralsportsfan.com/asset/colleges/2015/01/23/14381597/horrified_crowd_reaction-288x209.gif",
    "https://media.giphy.com/media/QgixZj4y3TwnS/giphy.gif"
];

for (var i = 0; i < 130; i++) {
    images.push("http://media1.giphy.com/media/IfaFEvfGz8CXK/giphy.gif");
}

module.exports = function(robot) {
    return robot.hear(/dibsy (slam|burn)/i, function(msg) {
        return msg.send(msg.random(images) + "?_=" + (Math.ceil(Math.random() * 1000)));
    });
};

