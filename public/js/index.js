$(document).ready(function(){
    $(".signUp").click(function(){
        $("#signUp").fadeIn(500);
        $("#logIn").hide();
        $(".signUp").css("color", "deepskyblue");
        $(".logIn").css("color", "white");
    });
    $(".logIn").click(function(){
        $("#signUp").hide();
        $("#logIn").fadeIn(500);
        $(".logIn").css("color", "deepskyblue");
        $(".signUp").css("color", "white");
    });
});
function openNav() {
    document.getElementById("mySidenav").style.width = "60%";
    document.getElementById("naveffect").style.opacity = "0.8";
    document.getElementById("naveffect").style.width = "100%";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("naveffect").style.width = "0%";
    document.getElementById("naveffect").style.opacity = "0";
    
}