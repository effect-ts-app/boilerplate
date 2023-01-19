if which humanlog >/dev/null; then
    # For some reason --skip-unchanged is enabled by default and can't figure out how to disable!
    # https://github.com/humanlogio/humanlog/issues/40
    tee dev.log | (humanlog --keep requestId --keep requestName --truncate-length 16384 || (echo 'humanlog crashed!' && cat))
else
    echo "!! It's recommended to install humanlog, to make these logs more readable. !!"
    # while read x ; do echo $x ; done
    tee dev.log
fi
